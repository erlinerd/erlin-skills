#!/usr/bin/env node
// 生成带角标的 iOS dev 图标（1024×1024）；dev 构建工作流见 references/dev-build.md
//
// 用法:
//   node make_dev_icon.mjs <输入正式图标.png> <输出路径.png> [角标文字, 默认 dev] [样式: capsule|dot, 默认 capsule]
//
// 样式:
//   capsule - 左上角白色标签 + 黑色文字（默认；左上角、约占方形 1/9、字体大、仅右下角圆角）
//   dot     - 左上角橙色圆点（呼应 TestFlight 橙 #FF9500）
//
// 栅格化走 macOS 原生 swift kernel（dev_icon.swift，零 npm 依赖，替代原 make_dev_icon.py 的 Pillow）。

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const USAGE = `用法:
  node make_dev_icon.mjs <输入正式图标.png> <输出路径.png> [角标文字, 默认 dev] [样式: capsule|dot, 默认 capsule]

样式:
  capsule - 左上角白色标签 + 黑色文字（默认）
  dot     - 左上角橙色圆点`;

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2 || args.length > 4) {
    console.error(USAGE);
    process.exit(1);
  }
  const kernel = join(
    dirname(fileURLToPath(import.meta.url)),
    "dev_icon.swift",
  );
  try {
    const stdout = execFileSync("swift", [kernel, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    });
    process.stdout.write(stdout);
  } catch (err) {
    process.exit(err.status ?? 1);
  }
}

main();
