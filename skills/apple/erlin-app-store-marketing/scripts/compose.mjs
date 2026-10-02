#!/usr/bin/env node
// App Store 截图合成器：标题文字 + 设备框模板 + App 截图 → 1290×2796 App Store Connect 成图。
// 设备框按固定 Y=720 摆放；文字水平居中，起始 Y 固定 200，位于画布顶部与设备之间。
// 栅格化走 swift 内核（raster.swift compose）；文字宽度度量走 measure 行协议；布局算法在本文件。

import { basename, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { startMeasureKernel, runKernel, sipsDimensions } from "./kernel.mjs";

const CANVAS_W = 1290;
const CANVAS_H = 2796;

// 设备模板常量（必须与 generate_frame 一致）
const DEVICE_W = 1030;
const BEZEL = 15; // 设备边框宽
const SCREEN_W = DEVICE_W - 2 * BEZEL; // 1000
const SCREEN_CORNER_R = 62;

// 布局
const DEVICE_Y = 720; // 设备顶部位置（固定）
const MIN_TEXT_DEVICE_GAP = 40; // 文字底部与设备顶部最小间距

// 排版
const VERB_SIZE_MAX = 256;
const VERB_SIZE_MIN = 150;
const DESC_SIZE = 124;
const VERB_DESC_GAP = 20;
const DESC_LINE_GAP = 24;
const MAX_TEXT_W = Math.floor(CANVAS_W * 0.92);
const MAX_VERB_W = Math.floor(CANVAS_W * 0.92);
const FRAME_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "device_frame.png");

const USAGE =
  "用法: node compose.mjs --bg '#E31837' --verb TRACK --desc 'TRADING CARD PRICES' --screenshot shot.png --output out.png";

export function hexToRgb(hex) {
  const clean = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) throw new Error(`无效背景色: ${hex}`);
  return [0, 2, 4].map((offset) => parseInt(clean.slice(offset, offset + 2), 16));
}

// 贪心换行：词内按字符断、词间按空格拼
export async function wordWrap(text, measureText, maxWidth) {
  const lines = [];
  let cur = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const chunks = [];
    let chunk = "";
    for (const char of word) {
      const test = chunk + char;
      if (chunk && (await measureText(test)) > maxWidth) {
        chunks.push(chunk);
        chunk = char;
      } else {
        chunk = test;
      }
    }
    if (chunk) chunks.push(chunk);

    for (const piece of chunks) {
      const merged = `${cur} ${piece}`.trim();
      if (cur && (await measureText(merged)) > maxWidth) {
        lines.push(cur);
        cur = piece;
      } else {
        cur = merged;
      }
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// 最大可用字号
export async function fitFont(text, maxWidth, sizeMax, sizeMin, measureWidth) {
  for (let size = sizeMax; size >= sizeMin; size -= 4) {
    if ((await measureWidth(text, size)) <= maxWidth) return size;
  }
  return sizeMin;
}

// 产出 swift 内核的文字条目；advance 含 DESC_LINE_GAP
async function placeLines(text, size, capHeight, startY, maxWidth, measureText) {
  const lines = maxWidth ? await wordWrap(text, measureText, maxWidth) : [text];
  const placed = [];
  let cursor = startY;
  for (const line of lines) {
    placed.push({ text: line, size, y: cursor, anchor: "mt", weight: "black", colorRgb: [255, 255, 255] });
    cursor += capHeight + DESC_LINE_GAP;
  }
  return { placed, endY: cursor };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith("--") || value === undefined) {
      console.error(USAGE);
      process.exit(2);
    }
    args[key.slice(2)] = value;
  }
  const missing = ["bg", "verb", "desc", "screenshot", "output"].filter((name) => !args[name]);
  if (missing.length) {
    console.error(`缺少参数: ${missing.map((name) => `--${name}`).join(" ")}`);
    console.error(USAGE);
    process.exit(2);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let bgRgb;
  try {
    bgRgb = hexToRgb(args.bg);
  } catch (err) {
    console.error(`错误: ${err.message}`);
    process.exit(1);
  }

  const kernel = startMeasureKernel();
  try {
    const measureWidth = (text, size) => kernel.measure(text, size, "black").then((metric) => metric.w);
    const capOf = (size) => kernel.measure("X", size, "black").then((metric) => metric.capH);

    const verbText = args.verb.toUpperCase();
    const descText = args.desc.toUpperCase();
    const verbSize = await fitFont(verbText, MAX_VERB_W, VERB_SIZE_MAX, VERB_SIZE_MIN, measureWidth);
    const verbCap = await capOf(verbSize);
    const descCap = await capOf(DESC_SIZE);

    const verbBlock = await placeLines(verbText, verbSize, verbCap, 200, null, measureWidth);
    const descBlock = await placeLines(
      descText,
      DESC_SIZE,
      descCap,
      verbBlock.endY + VERB_DESC_GAP,
      MAX_TEXT_W,
      measureWidth,
    );
    if (descBlock.endY + MIN_TEXT_DEVICE_GAP > DEVICE_Y) {
      console.error("description is too long for the available text area");
      process.exit(1);
    }

    const shotDims = sipsDimensions(args.screenshot);
    const shotScale = SCREEN_W / shotDims.width;
    const shotH = Math.floor(shotDims.height * shotScale);
    const deviceX = Math.floor((CANVAS_W - DEVICE_W) / 2);
    const screenY = DEVICE_Y + BEZEL;
    runKernel("compose", {
      canvasW: CANVAS_W,
      canvasH: CANVAS_H,
      bgRgb,
      out: args.output,
      texts: [...verbBlock.placed, ...descBlock.placed],
      screen: {
        x: deviceX + BEZEL,
        y: screenY,
        w: SCREEN_W,
        h: CANVAS_H - screenY + 500, // 屏幕延伸到画布底部 + 溢出
        r: SCREEN_CORNER_R,
        shot: { path: args.screenshot, h: shotH },
      },
      frame: { path: FRAME_PATH, x: deviceX, y: DEVICE_Y, w: DEVICE_W, h: 2800 },
    });
    console.log(`✓ ${args.output} (${CANVAS_W}×${CANVAS_H})`);
  } finally {
    kernel.close();
  }
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  main().catch((err) => {
    console.error(`错误: ${err.message}`);
    process.exit(1);
  });
}
