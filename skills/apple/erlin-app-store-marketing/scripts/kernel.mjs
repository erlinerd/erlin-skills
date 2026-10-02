// 共享基础设施：swift 栅格内核（raster.swift）客户端 + sips 尺寸读取。
// measure 子命令是行协议：每行 JSON 请求（text/size/weight）对应一行 JSON 响应（w/capH），
// 一个进程内可高频往返，供 node 侧的换行/字号适配算法逐次查询。

import { execFileSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";

export const rasterKernel = join(dirname(fileURLToPath(import.meta.url)), "raster.swift");

export function startMeasureKernel() {
  const child = spawn("swift", [rasterKernel, "measure"], { stdio: ["pipe", "pipe", "inherit"] });
  const pending = [];
  // swift 不存在（非 macOS / 缺 Xcode CLT）时 ENOENT 走 'error' 事件；不监听会抛未捕获异常
  child.on("error", (e) => {
    console.error(`无法启动 swift 栅格内核（仅 macOS，需 Xcode CLT）: ${e.message}`);
    while (pending.length) pending.shift()({ w: 0, capH: 0 });
    process.exit(1);
  });
  const reader = createInterface({ input: child.stdout });
  reader.on("line", (line) => {
    const resolve = pending.shift();
    if (!resolve) return;
    try {
      resolve(JSON.parse(line));
    } catch {
      // 内核输出异常行：按零宽处理，不打断 measure 协议
      resolve({ w: 0, capH: 0 });
    }
  });
  child.on("exit", () => {
    while (pending.length) pending.shift()({ w: 0, capH: 0 });
  });
  return {
    measure(text, size, weight = "black") {
      return new Promise((resolve) => {
        pending.push(resolve);
        child.stdin.write(`${JSON.stringify({ text, size, weight })}\n`);
      });
    },
    close() {
      child.stdin.end();
      child.kill();
    },
  };
}

/// 单次调用内核子命令；payload 走 stdin，extraArgs 为位置参数
export function runKernel(command, payload, extraArgs = []) {
  return execFileSync("swift", [rasterKernel, command, ...extraArgs], {
    input: payload ? JSON.stringify(payload) : undefined,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "inherit"],
  });
}

export function sipsDimensions(imagePath) {
  const out = execFileSync("/usr/bin/sips", ["-g", "pixelWidth", "-g", "pixelHeight", imagePath], {
    encoding: "utf8",
  });
  const width = Number(out.match(/pixelWidth: (\d+)/)?.[1]);
  const height = Number(out.match(/pixelHeight: (\d+)/)?.[1]);
  if (!width || !height) throw new Error(`无法读取图片尺寸: ${imagePath}`);
  return { width, height };
}
