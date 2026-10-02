#!/usr/bin/env node
// App 图标渲染（node 编排 + swift 栅格内核 icon_raster.swift，替代原 render_icon.py）。
//
// 用法:
//   node render_icon.mjs [输出目录] [--config <config.json>]
//
// config.json（写到项目内并 gitignore，勿改本脚本——技能目录经 symlink 是 git 工作树）:
//   { "bg": "10,10,12,255", "ink": "...", "accent": "...", "wordmark": "...",
//     "fontSize": 290, "weights": ["regular"], "variants": ["plain","in-glyph"],
//     "accentGlyph": "o", "accentDotSize": 58 }
//   所有键可选，缺省回退下方默认值。
//
// 设计要点（承自原 .py）:
//   - 墨迹框居中: 字体度量的理论中心渲染后，扫描实际墨迹像素做自校准平移，
//     中心保证 512±1px。
//   - 强调元素定位: 目标字形墨迹中心 = 前缀 advance + 单字墨迹中心；
//     字形查找按 wordmark 实际字符(注意大小写)。
//   - 坐标系: 顶部原点、y 向下（与 Vision OCR 的左下原点 bbox 相反，别混）。

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ---------- 【默认配置】优先从 --config JSON 读，缺省回退这里的示例值 ----------
const cfgIdx = process.argv.indexOf("--config");
let CFG = {};
if (cfgIdx >= 0) {
  const cfgPath = process.argv[cfgIdx + 1];
  if (!cfgPath || cfgPath.startsWith("--")) {
    console.error("--config 需要跟一个 JSON 文件路径");
    process.exit(2);
  }
  try {
    CFG = JSON.parse(readFileSync(cfgPath, "utf8")) ?? {};
  } catch (e) {
    console.error(`--config 读取/解析失败 (${cfgPath}): ${e.message}`);
    process.exit(2);
  }
  if (typeof CFG !== "object" || Array.isArray(CFG)) {
    console.error(`--config 内容必须是 JSON 对象: ${cfgPath}`);
    process.exit(2);
  }
}

const BG = CFG.bg ?? "10,10,12,255"; // 品牌背景色
const INK = CFG.ink ?? "242,241,236,255"; // 主内容色
const ACCENT = CFG.accent ?? "255,176,84,255"; // 强调色

const WORDMARK = CFG.wordmark ?? "Demo Clock"; // wordmark 文本(字形查找按实际字符!)
const FONT_SIZE = CFG.fontSize ?? 290;
const WEIGHTS = CFG.weights ?? ["regular"]; // 输出后缀（kernel 固定 SFNS.ttf 首个 face，保留配置面）

// 变体: "plain" 纯字 | "trailing-dots" 尾部两点(冒号) | "in-glyph" 强调元素嵌入指定字形
const VARIANTS = CFG.variants ?? ["plain", "in-glyph"];
const ACCENT_DOT_SIZE = CFG.accentDotSize ?? FONT_SIZE * 0.2; // 强调元素直径(黄金比例:元素:宿主腹腔≈0.618)
const ACCENT_GLYPH = CFG.accentGlyph ?? "o"; // in-glyph 嵌入的字形(按 wordmark 实际字符)
// ---------------------------------------------

const SIZE = 1024;
const KERNEL = join(dirname(fileURLToPath(import.meta.url)), "icon_raster.swift");
const OUT =
  process.argv
    .slice(2)
    .filter((a, i) => a !== "--config" && process.argv.slice(2)[i - 1] !== "--config")[0] ||
  "output";

// kerning pair 警告在此省略：仅影响相邻字距警告，不影响中心定位与渲染输出。
function warnKerning() {}

function kernel(...args) {
  return execFileSync("swift", [KERNEL, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
}

// PIL anchor="ls" 语义: {bbox:[x0,y0,x1,y1], advance}（顶部原点、y 向下）
function measure(text, fontSize = FONT_SIZE) {
  return JSON.parse(kernel("measure", String(fontSize), text));
}

function drawText(path, originX, baselineY) {
  kernel("draw", path, String(FONT_SIZE), String(originX), String(baselineY), WORDMARK, BG, INK);
}

function drawDot(path, centerX, centerY, radius) {
  kernel("dot", path, path, String(centerX), String(centerY), String(radius), ACCENT);
}

function scanInk(path) {
  return JSON.parse(kernel("scan", path)).ink;
}

function theoreticalOrigin() {
  // 理论居中(墨迹框中心 = 画布中心);渲染后还会自校准
  const [x0, y0, x1, y1] = measure(WORDMARK).bbox;
  return { originX: SIZE / 2 - (x0 + x1) / 2, baselineY: SIZE / 2 - (y0 + y1) / 2 };
}

// 渲染后扫描实际墨迹: 中心偏离画布中心 >1px 则平移重绘(最多 3 轮)。
// 返回实际渲染的原点/基线（实测 SFNS 渲染与字体度量有 ~0.07em 系统偏差，
// 强调元素等后续定位必须用实际值,不能用理论值）。
function calibrate(path) {
  const start = theoreticalOrigin();
  drawText(path, start.originX, start.baselineY);
  let { originX, baselineY } = start;
  let ink = null;
  for (let round = 0; round < 3; round += 1) {
    ink = scanInk(path);
    if (!ink) return { originX, baselineY };
    const dx = (ink[0] + ink[2]) / 2 - SIZE / 2;
    const dy = (ink[1] + ink[3]) / 2 - SIZE / 2;
    if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
      originX -= dx;
      baselineY -= dy;
      drawText(path, originX, baselineY);
      continue;
    }
    break;
  }
  const [x0, y0] = measure(WORDMARK).bbox;
  return { originX: ink[0] - x0, baselineY: ink[1] - y0 }; // 实际渲染原点/基线(从扫描结果反推)
}

// 目标字形墨迹中心(画布坐标);找不到返回 null
function glyphInkCenter(originX, baselineY, text, target) {
  if (!text.includes(target)) return null;
  const index = text.indexOf(target);
  const prefixWidth = measure(text.slice(0, index)).advance; // CoreText advance,与渲染一致
  const [x0, y0, x1, y1] = measure(target).bbox;
  return { cx: originX + prefixWidth + (x0 + x1) / 2, cy: baselineY + (y0 + y1) / 2 };
}

function render() {
  warnKerning();
  mkdirSync(OUT, { recursive: true });
  for (const weight of WEIGHTS) {
    if (VARIANTS.includes("plain")) {
      const path = join(OUT, `icon-plain-${weight}.png`);
      calibrate(path);
      console.log(`已写入 ${path}`);
    }

    if (VARIANTS.includes("trailing-dots")) {
      const path = join(OUT, `icon-trailing-${weight}.png`);
      const actual = calibrate(path);
      const [, y0, , y1] = measure("X").bbox;
      const capHeight = y1 - y0;
      const textWidth = measure(WORDMARK).advance;
      const dot = FONT_SIZE * 0.075;
      const gap = FONT_SIZE * 0.1;
      const column = FONT_SIZE * 0.16;
      const dotX = actual.originX + textWidth + gap + column / 2;
      drawDot(path, dotX, actual.baselineY - capHeight * 0.62, dot / 2);
      drawDot(path, dotX, actual.baselineY - capHeight * 0.24, dot / 2);
      console.log(`已写入 ${path}`);
    }

    if (VARIANTS.includes("in-glyph")) {
      const path = join(OUT, `icon-inglyph-${weight}.png`);
      const actual = calibrate(path);
      const center = glyphInkCenter(actual.originX, actual.baselineY, WORDMARK, ACCENT_GLYPH);
      if (center) {
        drawDot(path, center.cx, center.cy, ACCENT_DOT_SIZE / 2);
        // 打印验证门禁需要的目标字形中心，供 verify_icon.mjs --accent-target 直接复制
        console.log(`accent-target: ${center.cx.toFixed(1)},${center.cy.toFixed(1)},1`);
      } else {
        console.error(`警告: 字形 '${ACCENT_GLYPH}' 不在 wordmark 中,跳过强调元素`);
      }
      console.log(`已写入 ${path}`);
    }
  }
}

render();
