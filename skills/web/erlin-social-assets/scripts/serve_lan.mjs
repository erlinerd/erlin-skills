#!/usr/bin/env node
// serve_lan.mjs — 局域网图片/物料预览服务（替代原 serve_lan.py，纯 node 内置模块 + sips）
//
// 用法:
//   node serve_lan.mjs <目录> [--port 8765] [--idle 10]   # 起服务（后台常驻），打印局域网 URL
//   node serve_lan.mjs --list                 # 列出在跑的服务
//   node serve_lan.mjs --stop <port|all>      # 停止服务
//
// 行为:
//   - 扫描目录（含子目录）的图片，首页动态生成画廊（每次刷新重新扫描，新增图即时可见）
//   - 图片尺寸标注走 sips（macOS 自带，无则只显示文件名）
//   - 端口被占自动 +1 递增；进程脱离会话常驻；注册表 ~/.lan-serve/servers.json
//   - **闲置自动关闭**：默认 10 分钟无任何请求自动退出（--idle 可调），端口不常占
//   - 绑定 0.0.0.0，同一 Wi-Fi 下手机/平板直接访问

import { execFile, execFileSync, spawn } from "node:child_process";
import dgram from "node:dgram";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const REGISTRY_DIR = path.join(os.homedir(), ".lan-serve");
const REGISTRY = path.join(REGISTRY_DIR, "servers.json");
const IMAGE_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

const MIME = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

const GALLERY_PAGE = `<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
  body { margin: 0; padding: 20px; background: #171614; color: #e8e5df;
         font-family: -apple-system, "PingFang SC", sans-serif; }
  h1 { font-size: 18px; font-weight: 600; }
  .hint { font-size: 12px; color: #8f8b84; margin: 4px 0 18px; }
  .pathrow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
  .path { font-size: 12px; color: #a8a49d; font-family: ui-monospace, monospace; }
  .btn { font-size: 12px; color: #e8e5df; background: #2a2723; border: 1px solid #3a3732;
         border-radius: 8px; padding: 5px 12px; cursor: pointer; text-decoration: none; }
  .btn:hover { background: #34302b; }
  details.group { background: #211f1c; border-radius: 10px; margin-bottom: 12px; overflow: hidden; }
  details.group summary { list-style: none; display: flex; align-items: center;
         justify-content: space-between; padding: 13px 16px; cursor: pointer; user-select: none; }
  details.group summary::-webkit-details-marker { display: none; }
  details.group summary h2 { font-size: 13px; color: #8f8b84; font-weight: 500; margin: 0; }
  details.group summary .chev { transition: transform .25s ease; display: inline-block; font-size: 12px; color: #8f8b84; }
  details.group[open] summary .chev { transform: rotate(180deg); }
  details.group .grid-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s ease; }
  details.group[open] .grid-wrap { grid-template-rows: 1fr; }
  details.group .grid-inner { overflow: hidden; }
  details.group .grid { display: flex; flex-wrap: wrap; gap: 14px; padding: 2px 16px 16px; }
  .card { background: #2a2723; border-radius: 10px; padding: 10px; }
  .card img { height: 300px; max-width: 100%; border-radius: 6px; display: block; cursor: zoom-in; }
  .meta { font-size: 11px; color: #8f8b84; margin-top: 6px; font-family: ui-monospace, monospace; }
  dialog { border: 0; background: transparent; }
  dialog img { max-height: 92vh; max-width: 94vw; border-radius: 8px; }
</style>
</head>
<body>
<h1>{title}</h1>
<div class="hint">{count} 张图 · 点组标题展开/收起 · 点图放大 · 刷新即重扫目录</div>
<div class="pathrow">
  <span class="path">📁 {root}</span>
  <button class="btn" onclick="copyPath()">复制路径</button>
  <a class="btn" href="/__open" onclick="return confirm('在 Mac 上打开该目录？')">在 Mac 上打开</a>
</div>
{groups}
<dialog id="lightbox" onclick="this.close()"><img id="lb"></dialog>
<script>
const ROOT = {rootJs};
function copyPath() {
  navigator.clipboard.writeText(ROOT).then(() => alert('路径已复制'));
}
document.addEventListener('click', e => {
  const img = e.target.closest('.card img');
  if (!img) return;
  document.getElementById('lb').src = img.src;
  document.getElementById('lightbox').showModal();
});
</script>
</body>
</html>`;

const GROUP_PAGE = `<details class="group"{openAttr}>
<summary><h2>{label}</h2><span class="chev">{n} 张 ▾</span></summary>
<div class="grid-wrap"><div class="grid-inner"><div class="grid">{cards}</div></div></div>
</details>`;
const CARD = `<div class="card"><a href="{src}"><img loading="lazy" src="{src}"></a><div class="meta">{name} · {dim}</div></div>`;

// ── 基础工具 ──────────────────────────────────────────────────────────

async function lanIp() {
  // macOS: 优先物理网卡（en0/en1），避免抓到 VPN/隧道接口（如 198.18.x）
  for (const iface of ["en0", "en1"]) {
    try {
      const { stdout } = await execFileAsync(
        "/usr/sbin/ipconfig",
        ["getifaddr", iface],
        { timeout: 3000 },
      );
      const ip = stdout.trim();
      if (ip && !ip.startsWith("127.")) return ip;
    } catch {
      /* 接口不存在或没 IP，继续 */
    }
  }
  // 兜底：默认路由接口（Linux 等）
  return new Promise((resolve) => {
    const sock = dgram.createSocket("udp4");
    const done = (ip) => {
      try {
        sock.close();
      } catch {
        /* 已关 */
      }
      resolve(ip);
    };
    sock.on("error", () => done("127.0.0.1"));
    sock.connect(80, "8.8.8.8", () =>
      done(sock.address().address || "127.0.0.1"),
    );
  });
}

function imageDimensions(filePath) {
  if (process.platform !== "darwin") return "";
  try {
    const out = execFileSync(
      "/usr/bin/sips",
      ["-g", "pixelWidth", "-g", "pixelHeight", filePath],
      {
        encoding: "utf8",
        timeout: 5000,
        stdio: ["ignore", "pipe", "ignore"],
      },
    );
    const w = out.match(/pixelWidth: (\d+)/)?.[1];
    const h = out.match(/pixelHeight: (\d+)/)?.[1];
    return w && h ? `${w}×${h}` : "";
  } catch {
    return "";
  }
}

function walkImages(root) {
  const files = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (
        entry.isFile() &&
        IMAGE_EXTS.has(path.extname(entry.name).toLowerCase())
      )
        files.push(full);
    }
  }
  return files.sort();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderGallery(root) {
  const groups = new Map();
  for (const full of walkImages(root)) {
    const rel = path.relative(root, full);
    const parent = path.dirname(rel);
    const label = parent === "." ? "（根目录）" : parent;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label).push(full);
  }

  let count = 0;
  const parts = [];
  [...groups.keys()].sort().forEach((label, index) => {
    const files = groups.get(label);
    const cards = files
      .map((full) => {
        const src = encodeURI(path.relative(root, full));
        const dim = imageDimensions(full);
        count += 1;
        return CARD.replaceAll("{src}", src)
          .replaceAll("{name}", escapeHtml(path.basename(full)))
          .replaceAll("{dim}", dim || "—");
      })
      .join("");
    parts.push(
      GROUP_PAGE.replaceAll("{openAttr}", index === 0 ? " open" : "")
        .replaceAll("{label}", escapeHtml(`${label} · ${files.length} 张`))
        .replaceAll("{n}", String(files.length))
        .replaceAll("{cards}", cards),
    );
  });

  return GALLERY_PAGE.replaceAll(
    "{title}",
    escapeHtml(path.basename(path.resolve(root)) || String(root)),
  )
    .replaceAll("{count}", String(count))
    .replaceAll("{root}", escapeHtml(String(root)))
    .replaceAll("{rootJs}", JSON.stringify(String(root)))
    .replaceAll("{groups}", parts.join("\n"));
}

// ── worker（实际常驻的服务进程） ──────────────────────────────────────

function serveStatic(req, res, root) {
  const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const full = path.resolve(root, "." + urlPath);
  if (!full.startsWith(path.resolve(root) + path.sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  let stat;
  try {
    stat = fs.statSync(full);
  } catch {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }
  if (stat.isDirectory()) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }
  res.writeHead(200, {
    "Content-Type":
      MIME[path.extname(full).toLowerCase()] ?? "application/octet-stream",
    "Content-Length": stat.size,
  });
  fs.createReadStream(full).pipe(res);
}

function runWorker(root, port, idleMinutes) {
  let lastActivity = Date.now();
  const server = http.createServer((req, res) => {
    lastActivity = Date.now();
    if (req.url === "/__open" && process.platform === "darwin") {
      // 从 Mac 浏览器点"在 Mac 上打开"→ Finder 弹出该目录；手机端点了无副作用
      spawn("open", [root], { stdio: "ignore", detached: true }).unref();
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("ok");
      return;
    }
    if (req.url === "/" || req.url === "/index.html") {
      const body = Buffer.from(renderGallery(root), "utf8");
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Length": body.length,
      });
      res.end(body);
      return;
    }
    serveStatic(req, res, root);
  });

  process.on("SIGTERM", () => process.exit(0));

  // 闲置超时守护：无请求超过 idleMinutes 分钟则自动关闭服务
  setInterval(() => {
    if (Date.now() - lastActivity > idleMinutes * 60_000) {
      console.error(`闲置 ${idleMinutes} 分钟无访问，自动关闭`);
      process.exit(0);
    }
  }, 30_000);

  server.listen(port, "0.0.0.0");
}

// ── 注册表 ────────────────────────────────────────────────────────────

function loadRegistry() {
  try {
    return JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  } catch {
    return {};
  }
}

function saveRegistry(data) {
  fs.mkdirSync(REGISTRY_DIR, { recursive: true });
  fs.writeFileSync(REGISTRY, JSON.stringify(data, null, 2));
}

function registryStamp(name, started) {
  // 注册表指纹：进程启动时间。PID 复用后新进程的启动时间不同，据此识别陈旧条目
  return { name, started };
}

function processBootTime(pid) {
  // macOS/Linux: 取进程启动时间（秒精度即可区分复用）；失败返回 null
  try {
    const out = execFileSync("ps", ["-p", String(pid), "-o", "lstart="], {
      encoding: "utf8",
      timeout: 3000,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const t = out.trim();
    return t || null;
  } catch {
    return null;
  }
}

// 清理死亡/复用条目；返回 {alive, pruned}，由调用方决定是否回写（--list 不再早退漏存）
function pruneDead(entries) {
  const alive = {};
  const pruned = [];
  for (const [port, info] of Object.entries(entries)) {
    const pid = Number(info.pid);
    let stale = false;
    try {
      process.kill(pid, 0);
      // 进程活着，但 PID 可能已被复用：比对注册时记录的启动时间指纹
      const boot = processBootTime(pid);
      if (info.bootTime && boot && boot !== info.bootTime) stale = true;
    } catch {
      stale = true; // 进程已死
    }
    if (stale) pruned.push({ port, dir: info.dir, pid });
    else alive[port] = info;
  }
  return { alive, pruned };
}

function dropPruned(entries, pruned) {
  // 从注册表删除 pruned 条目并回写；有变化才写盘
  if (!pruned.length) return false;
  for (const { port } of pruned) delete entries[port];
  saveRegistry(entries);
  return true;
}

function portFree(port) {
  return new Promise((resolve) => {
    const sock = net.createConnection({ port, host: "127.0.0.1" });
    sock.on("connect", () => {
      sock.destroy();
      resolve(false);
    });
    sock.on("error", () => resolve(true));
  });
}

async function waitHealthy(port, timeoutMs = 6000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.status === 200) return true;
    } catch {
      /* 未就绪，继续轮询 */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

// ── 命令 ──────────────────────────────────────────────────────────────

function formatStamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

async function start(directory, portOption, idleMinutes) {
  const root = path.resolve(directory);
  if (!fs.statSync(root, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`目录不存在: ${root}`);
    process.exit(1);
  }

  const { alive: entries, pruned } = pruneDead(loadRegistry());
  dropPruned(loadRegistry(), pruned);
  let port = portOption;
  while (!(await portFree(port)) || String(port) in entries) port += 1;

  const scriptPath = path.resolve(process.argv[1]);
  const worker = spawn(
    process.execPath,
    [scriptPath, "--worker", root, String(port), String(idleMinutes)],
    {
      detached: true,
      stdio: "ignore",
    },
  );
  worker.unref();

  if (!(await waitHealthy(port))) {
    console.error("服务启动失败（检查 macOS 防火墙是否放行 node）");
    process.exit(1);
  }

  entries[String(port)] = {
    dir: root,
    pid: worker.pid,
    bootTime: processBootTime(worker.pid),
    started: formatStamp(),
  };
  saveRegistry(entries);
  const ip = await lanIp();
  console.log(
    `已启动: http://${ip}:${port}   （目录 ${root}，闲置 ${idleMinutes} 分钟自动关闭，停止: --stop ${port}）`,
  );
}

function listServers() {
  const { alive: entries, pruned } = pruneDead(loadRegistry());
  // 无论是否有存活服务，先落盘清理结果（避免 --list 早退导致陈旧条目永久残留）
  dropPruned(loadRegistry(), pruned);
  if (!Object.keys(entries).length) {
    console.log("没有在跑的服务");
    return Promise.resolve();
  }
  return lanIp().then((ip) => {
    for (const [port, info] of Object.entries(entries).sort(
      (a, b) => Number(a[0]) - Number(b[0]),
    )) {
      console.log(
        `http://${ip}:${port}  →  ${info.dir}  (pid ${info.pid}, ${info.started})`,
      );
    }
  });
}

function stop(target) {
  const { alive: entries, pruned } = pruneDead(loadRegistry());
  dropPruned(loadRegistry(), pruned);
  const ports = target === "all" ? Object.keys(entries) : [target];
  for (const port of ports) {
    const info = entries[port];
    if (!info) {
      console.log(`端口 ${port} 没有在跑的服务`);
      continue;
    }
    delete entries[port];
    try {
      process.kill(Number(info.pid), "SIGTERM");
      console.log(`已停止 :${port} (${info.dir})`);
    } catch (error) {
      console.log(`停止 :${port} 失败: ${error.message}`);
    }
  }
  saveRegistry(entries);
}

function usage() {
  console.log(`用法: node serve_lan.mjs <目录> [--port 8765] [--idle 10]
       node serve_lan.mjs --list
       node serve_lan.mjs --stop <port|all>`);
}

async function main() {
  const args = process.argv.slice(2);
  const getOption = (name) => {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
  };

  const workerArgs = args[0] === "--worker" ? args.slice(1) : null;
  if (workerArgs) {
    runWorker(workerArgs[0], Number(workerArgs[1]), Number(workerArgs[2]));
  } else if (args.includes("--list")) {
    await listServers();
  } else if (args.includes("--stop")) {
    stop(args[args.indexOf("--stop") + 1]);
  } else if (args.length && !args[0].startsWith("-")) {
    const port = Number(getOption("--port") ?? 8765);
    const idle = Number(getOption("--idle") ?? 10);
    await start(args[0], port, idle);
  } else {
    usage();
  }
}

main();
