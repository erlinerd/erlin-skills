#!/usr/bin/env node
// Showcase 图生成器：最多 3 张成品截图等高并排在白底画布上，底部可选 GitHub 链接。
// 布局算法在本文件（与原 showcase.py 一致）；栅格化走 swift 内核（raster.swift showcase）。

import { basename } from "node:path";
import { startMeasureKernel, runKernel, sipsDimensions } from "./kernel.mjs";

const PADDING = 60;
const GAP = 40;
const BOTTOM_BAR_H = 100;
const TARGET_H = 800;
const FONT_SIZE_MAX = 48;
const FONT_SIZE_MIN = 16;

const USAGE =
  "用法: node showcase.mjs --screenshots a.png b.png c.png --output out.png [--github https://github.com/user/repo]";

function parseArgs(argv) {
  const args = { screenshots: [] };
  let current = null;
  for (const token of argv) {
    if (token.startsWith("--")) {
      current = token.slice(2);
      if (current === "screenshots") args.screenshots = [];
      else args[current] = null;
    } else if (current === "screenshots") {
      args.screenshots.push(token);
    } else if (current) {
      args[current] = token;
      current = null;
    }
  }
  if (!args.screenshots.length || !args.output) {
    console.error(USAGE);
    process.exit(2);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // 全部等高缩放到 TARGET_H（与 python int() 截断一致）
  const scaled = args.screenshots.map((shotPath) => {
    const dims = sipsDimensions(shotPath);
    return { path: shotPath, w: Math.floor(dims.width * (TARGET_H / dims.height)) };
  });
  const totalW =
    scaled.reduce((sum, shot) => sum + shot.w, 0) + GAP * (scaled.length - 1) + PADDING * 2;
  const totalH = TARGET_H + PADDING * 2 + (args.github ? BOTTOM_BAR_H : 0);

  let githubEntry = null;
  if (args.github) {
    const kernel = startMeasureKernel();
    try {
      const maxWidth = totalW - PADDING * 2;
      let chosen = FONT_SIZE_MIN;
      for (let size = FONT_SIZE_MAX; size >= FONT_SIZE_MIN; size -= 2) {
        if ((await kernel.measure(args.github, size, "regular")).w <= maxWidth) {
          chosen = size;
          break;
        }
      }
      githubEntry = {
        text: args.github,
        size: chosen,
        y: PADDING + TARGET_H + Math.floor(BOTTOM_BAR_H / 2),
        anchor: "mm",
        weight: "regular",
        colorRgb: [0, 0, 0],
      };
    } finally {
      kernel.close();
    }
  }

  let cursorX = PADDING;
  const shots = scaled.map((shot) => {
    const entry = { path: shot.path, x: cursorX, w: shot.w };
    cursorX += shot.w + GAP;
    return entry;
  });

  runKernel("showcase", {
    canvasW: totalW,
    canvasH: totalH,
    padTop: PADDING,
    targetH: TARGET_H,
    out: args.output,
    shots,
    github: githubEntry,
  });
  console.log(`✓ ${args.output} (${totalW}×${totalH})`);
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  main().catch((err) => {
    console.error(`错误: ${err.message}`);
    process.exit(1);
  });
}
