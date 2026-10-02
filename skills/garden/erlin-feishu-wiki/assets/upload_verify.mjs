#!/usr/bin/env node
/**
 * 飞书文档批量上传 + Markdown 回查（Node/Bun 版）。
 *
 * 从项目根目录运行：
 *   node upload_verify.mjs verify
 *   node upload_verify.mjs upload --confirm-overwrite
 *   node upload_verify.mjs both --confirm-overwrite
 *   node upload_verify.mjs verify 00-home
 *
 * 配置：填写 T（文件名 -> doc token）与 KEYS（关键词 -> 期望次数）。
 * 推荐 FEISHU_WIKI_CONFIG=<json 路径> 提供配置（形态见下方说明）；T/KEYS 内联占位仅适合本地试验。
 * 可用 DRAFT_DIR 环境变量覆盖默认的 .erlin/course/ 草稿目录。
 */
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { isAbsolute, join } from "node:path";

const DRAFT_DIR = process.env.DRAFT_DIR || ".erlin/course";

// --content @<path> 的路径：绝对 DRAFT_DIR 直接用，相对路径补 ./ 前缀。
// 无条件拼 `@./${DRAFT_DIR}` 会把绝对路径坍缩成 `.//tmp/...` 这种坏值。
function draftPath(name) {
  const file = `${name}.md`;
  return isAbsolute(DRAFT_DIR) ? join(DRAFT_DIR, file) : `./${join(DRAFT_DIR, file)}`;
}

// 文件名 -> doc token。不要把真实 token 提交到公共仓库。
let T = {
  // "00-home": "<doc-token>",
};

// 文件名 -> 关键词 -> 期望出现次数。
let KEYS = {
  // "00-home": { "源码目录树": 1, "一次": 1 },
};

// 优先从外部 JSON 读配置（技能目录经 symlink 即 git 工作树，真实 token 写进
// 脚本顶部会被一次 commit 带进公开历史）。用法：
//   FEISHU_WIKI_CONFIG=.erlin/feishu-config.json node upload_verify.mjs ...
// JSON 形态：{ "T": { "<文件名>": "<doc-token>" }, "KEYS": { "<文件名>": { "<关键词>": <次数> } } }
// 该文件应加入项目 .gitignore。未设环境变量时回退到上方占位（会被空配置检查拒绝）。
if (process.env.FEISHU_WIKI_CONFIG) {
  const cfgPath = process.env.FEISHU_WIKI_CONFIG;
  if (!existsSync(cfgPath)) {
    console.error(`FEISHU_WIKI_CONFIG 指向的文件不存在: ${cfgPath}`);
    process.exit(1);
  }
  const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
  if (cfg.T) T = cfg.T;
  if (cfg.KEYS) KEYS = cfg.KEYS;
}

let failed = false;

function parseLark(output) {
  const start = output.indexOf("{");
  if (start < 0) throw new Error("lark-cli output contains no JSON");
  try {
    return JSON.parse(output.slice(start));
  } catch (error) {
    throw new Error(`invalid lark-cli JSON: ${error.message}`);
  }
}

function redact(text) {
  return text.replace(/(--doc\s+)\S+/g, "$1<redacted>");
}

function runLark(args) {
  try {
    return parseLark(execFileSync("lark-cli", args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }));
  } catch (error) {
    const detail = [error.stderr, error.stdout, error.message]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ");
    throw new Error(redact(detail || "lark-cli failed").slice(0, 240));
  }
}

function selectedEntries(filter) {
  const entries = Object.entries(T).filter(([name]) => !filter || name.includes(filter));
  if (entries.length === 0) throw new Error(filter ? `no document matches: ${filter}` : "T is empty");
  return entries;
}

function validateConfig(entries, mode) {
  if (mode === "upload" || mode === "both") {
    for (const [name, token] of entries) {
      if (!token || token.includes("<")) throw new Error(`missing document token for ${name}`);
      const path = draftPath(name);
      if (!existsSync(path)) throw new Error(`draft file not found: ${path}`);
    }
  }
  if (mode === "verify" || mode === "both") {
    for (const [name] of entries) {
      const assertions = KEYS[name];
      if (!assertions || Object.keys(assertions).length === 0) {
        throw new Error(`missing non-empty KEYS for ${name}`);
      }
      for (const [keyword, expected] of Object.entries(assertions)) {
        if (!Number.isInteger(expected) || expected < 0) {
          throw new Error(`invalid expected count for ${name}: ${keyword}`);
        }
      }
    }
  }
}

function upload(entries, confirmed, dryRun = false) {
  if (!confirmed && !dryRun) throw new Error("overwrite refused: add --confirm-overwrite");
  let ok = true;
  for (const [name, token] of entries) {
    try {
      const args = [
        "docs", "+update", "--doc", token,
        "--command", "overwrite", "--doc-format", "markdown",
        "--content", `@${draftPath(name)}`, "--as", "user",
      ];
      if (dryRun) {
        // dry-run 同样要检查返回体：CLI 可能正常退出但 ok=false（如 token 无效）。
        const obj = runLark([...args, "--dry-run"]);
        if (obj.ok !== true) throw new Error(redact(obj.error?.message || "dry-run returned ok=false"));
        console.log(`${name}: dry-run passed (remote unchanged)`);
        continue;
      }
      const obj = runLark(args);
      if (obj.ok !== true) throw new Error(redact(obj.error?.message || "API returned ok=false"));
      const rev = obj.data?.document?.revision_id;
      if (!rev) throw new Error("upload response has no revision_id");
      console.log(`${name}: uploaded rev=${rev}`);
    } catch (error) {
      ok = false;
      failed = true;
      console.error(`${name}: upload failed: ${error.message}`);
    }
  }
  return ok;
}

function verify(entries) {
  let ok = true;
  for (const [name, token] of entries) {
    try {
      const obj = runLark([
        "docs", "+fetch", "--doc", token, "--doc-format", "markdown", "--as", "user",
      ]);
      if (obj.ok !== true) throw new Error(redact(obj.error?.message || "API returned ok=false"));
      const content = obj.data?.document?.content;
      if (typeof content !== "string") throw new Error("response has no document.content");
      const rev = obj.data?.document?.revision_id;
      const wrong = Object.entries(KEYS[name])
        .filter(([keyword, expected]) => {
          const actual = content.split(keyword).length - 1;
          return actual !== expected;
        })
        .map(([keyword, expected]) => {
          const actual = content.split(keyword).length - 1;
          return `${keyword}: expected ${expected}, got ${actual}`;
        });
      if (wrong.length > 0) {
        ok = false;
        failed = true;
        console.error(`✗ ${name}: ${wrong.join("; ")}`);
      } else {
        console.log(`✓ ${name}: all assertions passed${rev ? ` rev=${rev}` : ""}`);
      }
    } catch (error) {
      ok = false;
      failed = true;
      console.error(`✗ ${name}: verify failed: ${error.message}`);
    }
  }
  return ok;
}

function parseArgs(args) {
  const mode = args[0] || "verify";
  if (!["upload", "verify", "both"].includes(mode)) {
    throw new Error(`invalid mode: ${mode}; use upload, verify, or both`);
  }
  const confirmed = args.includes("--confirm-overwrite");
  const dryRun = args.includes("--dry-run");
  const filters = args
    .filter((arg) => arg !== "--confirm-overwrite" && arg !== "--dry-run")
    .slice(1);
  if (filters.length > 1) throw new Error("use at most one document-name filter");
  return { mode, confirmed, dryRun, filter: filters[0] || null };
}

try {
  const { mode, confirmed, dryRun, filter } = parseArgs(process.argv.slice(2));
  const entries = selectedEntries(filter);
  const validationMode = mode === "both" && dryRun ? "upload" : mode;
  validateConfig(entries, validationMode);
  if (mode === "upload") upload(entries, confirmed, dryRun);
  if (mode === "verify") verify(entries);
  if (mode === "both") {
    if (dryRun) {
      upload(entries, confirmed, true);
    } else {
      const uploaded = upload(entries, confirmed);
      if (uploaded) verify(entries);
      else console.error("回查跳过：至少一页上传失败");
    }
  }
} catch (error) {
  failed = true;
  console.error(`ERROR: ${error.message}`);
}

if (failed) process.exitCode = 1;
