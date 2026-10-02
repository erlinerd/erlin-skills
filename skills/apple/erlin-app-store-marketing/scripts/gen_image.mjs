#!/usr/bin/env node
// opencodex 本地代理生图客户端（Responses API + image_generation tool）。
//
// 生成:  node gen_image.mjs --prompt "..." --output out.png
// 编辑:  node gen_image.mjs --prompt "..." --input-image base.png --output out.png
// 多图:  node gen_image.mjs --prompt "..." --input-image a.png --input-image b.png --output out.png
//
// 依赖: 本地 opencodex 代理（默认 http://127.0.0.1:10100，可用 OPENCODEX_URL 覆盖，仅接受 http/https）。
// 计费走 Codex 订阅，无需额外 API key。输出/输入图路径须位于当前工作目录内。

import fs from "node:fs";
import path, { basename } from "node:path";
import { pipeline } from "node:stream/promises";

const DEFAULT_URL = process.env.OPENCODEX_URL || "http://127.0.0.1:10100";
const DEFAULT_MODEL = "gpt-5.6-luna";
const DEFAULT_EFFORT = "max";

const USAGE = `生成:  node gen_image.mjs --prompt "..." --output out.png
编辑:  node gen_image.mjs --prompt "..." --input-image base.png --output out.png
多图:  node gen_image.mjs --prompt "..." --input-image a.png --input-image b.png --output out.png
选项:  --model --effort --size 1024x1536 --quality low|medium|high|auto --timeout 秒（默认 300）`;

export function validateProxyUrl(raw) {
  // OPENCODEX_URL 来自环境变量，属外部输入：只放行带主机名的 http/https URL。
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`OPENCODEX_URL 须为 http/https URL: ${JSON.stringify(raw)}`);
  }
  if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) {
    throw new Error(`OPENCODEX_URL 须为 http/https URL: ${JSON.stringify(raw)}`);
  }
  return raw;
}

// 已存在的路径取真实路径（捕获符号链接逃逸）；不存在的目标（如新输出文件）
// 逐级向上找到最近的存在祖先做 realpath，再拼回剩余后缀。
function realpathFlexible(raw) {
  const absolute = path.resolve(raw);
  if (fs.existsSync(absolute)) return fs.realpathSync(absolute);
  const parent = path.dirname(absolute);
  const realParent = fs.existsSync(parent) ? fs.realpathSync(parent) : realpathFlexible(parent);
  return path.join(realParent, path.basename(absolute));
}

export function checkedPath(raw, label) {
  // --output/--input-image 属外部输入：拒绝 NUL 与目录，解析后必须落在当前工作目录内。
  if (!raw || raw.includes("\0")) throw new Error(`非法${label}: ${JSON.stringify(raw)}`);
  const base = fs.realpathSync(process.cwd());
  const target = realpathFlexible(raw);
  if (target !== base && !target.startsWith(base + path.sep)) {
    throw new Error(`${label}越界（须位于 ${base} 内）: ${raw}`);
  }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    throw new Error(`${label}是目录: ${raw}`);
  }
  return target;
}

export function buildPayload(args) {
  const content = args.inputImages.map((imagePath) => ({
    type: "input_image",
    image_url: `data:image/png;base64,${fs.readFileSync(imagePath).toString("base64")}`,
  }));
  content.push({ type: "input_text", text: args.prompt });

  const tool = { type: "image_generation" };
  if (args.size) tool.size = args.size;
  if (args.quality) tool.quality = args.quality;

  return {
    model: args.model,
    stream: true, // codex 后端强制流式，非流式报 400
    input: [{ role: "user", content }],
    tools: [tool],
    reasoning: { effort: args.effort },
  };
}

// 从 SSE 流文件里取最后一个 image_generation_call.result（base64）
export function extractResult(streamPath) {
  let result = null;
  let status = null;
  for (const line of fs.readFileSync(streamPath, "utf8").split("\n")) {
    if (!line.startsWith("data: ")) continue;
    let data;
    try {
      data = JSON.parse(line.slice(6));
    } catch {
      continue;
    }
    let items = data.item ?? data.response?.output ?? [];
    if (!Array.isArray(items)) items = [items];
    for (const item of items) {
      if (item?.type === "image_generation_call") {
        status = item.status ?? null;
        if (item.result) result = item.result;
      }
    }
  }
  return [result, status];
}

function parseArgs(argv) {
  const args = {
    inputImages: [],
    model: DEFAULT_MODEL,
    effort: DEFAULT_EFFORT,
    timeout: 300,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const value = argv[index + 1];
    switch (token) {
      case "--prompt": args.prompt = value; index += 1; break;
      case "--output": args.output = value; index += 1; break;
      case "--input-image": args.inputImages.push(value); index += 1; break;
      case "--model": args.model = value; index += 1; break;
      case "--effort": args.effort = value; index += 1; break;
      case "--size": args.size = value; index += 1; break;
      case "--quality": args.quality = value; index += 1; break;
      case "--timeout": args.timeout = Number(value); index += 1; break;
      case "--help": case "-h": console.log(USAGE); process.exit(0); break;
      default: console.error(`未知参数: ${token}`); console.error(USAGE); process.exit(2);
    }
  }
  if (!args.prompt || !args.output) {
    console.error("the following arguments are required: --prompt, --output");
    console.error(USAGE);
    process.exit(2);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let proxyUrl;
  try {
    proxyUrl = validateProxyUrl(DEFAULT_URL);
    args.output = checkedPath(args.output, "输出路径");
    args.inputImages = args.inputImages.map((imagePath) => checkedPath(imagePath, "输入图"));
  } catch (err) {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  }

  const payload = buildPayload(args);
  const streamPath = `${args.output}.stream.tmp`;
  let response;
  try {
    response = await fetch(`${proxyUrl}/v1/responses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(args.timeout * 1000),
    });
  } catch (err) {
    console.error(`ERROR: opencodex 代理不可达（${DEFAULT_URL}）: ${err.message ?? err}`);
    console.error("先启动代理: opencodex start --port 10100");
    process.exit(1);
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    console.error(`ERROR: HTTP ${response.status} from opencodex: ${detail}`);
    process.exit(1);
  }

  try {
    await pipeline(response.body, fs.createWriteStream(streamPath));
  } catch (err) {
    console.error(`ERROR: opencodex 代理不可达（${DEFAULT_URL}）: ${err.message ?? err}`);
    console.error("先启动代理: opencodex start --port 10100");
    process.exit(1);
  }

  const [result, status] = extractResult(streamPath);
  if (!result) {
    fs.rmSync(streamPath, { force: true });
    console.error(`ERROR: 响应里没有图像结果（status=${status}）`);
    process.exit(1);
  }

  fs.writeFileSync(args.output, Buffer.from(result, "base64"));
  fs.rmSync(streamPath, { force: true });
  console.log(`OK: ${args.output}`);
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  main();
}
