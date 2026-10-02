#!/usr/bin/env node
// make_social.mjs — 社媒宣传图生成器（固定脚本，swift kernel 渲染，零 npm 依赖）
//
// 用法:
//   node scripts/make_social.mjs <config.json>
//
// 配置为 JSON，相对路径相对 config.json 所在目录解析，输出 PNG 写到 outputs[].file。
// 渲染走 macOS 原生 swift kernel（social_raster.swift，替代原 make_social.py 的 Pillow）；
// 中文字体用系统 PingFang.ttc，按字重自动定位；缺字重时回退 Regular。
//
// 布局两种（排版尺寸全部按画布比例缩放，同一配置可出任意平台规格）:
//   vertical — 竖版: 角落装饰点 / logo 行 / 大标题两行 / 副文案 / 截图圆角卡 / 装饰点条 / 页脚
//   wide     — 横版: 左侧文案（标题+副文案+装饰点条+页脚），右侧截图圆角卡
//
// 品牌色字段用 hex（"#RRGGBB"）或品牌键（"accent" / "ink" / "secondary" / "background"）。

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// 候选中文字体按序探测（_discover 移植：node 只做存在性检查，ttc 字面枚举在 kernel）；
// Hiragino Sans GB / STHeiti 为回退，均覆盖简体中文。
const FONT_CANDIDATES = [
  "/System/Library/Fonts/PingFang.ttc",
  "/System/Library/Fonts/Hiragino Sans GB.ttc",
  "/System/Library/Fonts/STHeiti Medium.ttc",
  "/System/Library/Fonts/STHeiti Light.ttc",
];

export function hexToRgb(value) {
  const hex = value.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`无效颜色值: ${value}`);
  return [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
}

export function resolveColor(brand, key) {
  return hexToRgb(brand[key] ?? key);
}

export function discoverFont(candidates = FONT_CANDIDATES, fileExists = (p) => fs.existsSync(p)) {
  for (const candidate of candidates) {
    if (fileExists(candidate)) return candidate;
  }
  throw new Error("找不到可用中文字体，请检查 FONT_CANDIDATES");
}

export function layoutCommand(layout) {
  return layout === "wide" ? "render-wide" : "render-vertical";
}

// 组装 swift kernel 的 spec：颜色统一解析为 RGB 数组；缺省字段与 python 的 spec.get 一致
export function buildSpec(outputSpec, brand, fontFile) {
  return {
    canvasW: outputSpec.width,
    canvasH: outputSpec.height,
    decor: outputSpec.decor ?? "dots",
    background: resolveColor(brand, brand.background),
    ink: resolveColor(brand, "ink"),
    accent: resolveColor(brand, "accent"),
    secondary: resolveColor(brand, "secondary"),
    motif: brand.motif.map((hex) => hexToRgb(hex)),
    logoText: outputSpec.logoText ?? null,
    title1: outputSpec.title1,
    title2: outputSpec.title2 ?? null,
    title2Color: resolveColor(brand, outputSpec.title2Color ?? "accent"),
    subtitle: outputSpec.subtitle ?? null,
    footer: outputSpec.footer ?? null,
    fileName: outputSpec.file,
    fontFile,
  };
}

function main() {
  if (process.argv.length !== 3) {
    console.error("用法: node make_social.mjs <config.json>");
    process.exit(1);
  }
  const configPath = path.resolve(process.argv[2]);
  const configDir = dirname(configPath);
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const fontFile = discoverFont();
  const kernel = join(dirname(fileURLToPath(import.meta.url)), "social_raster.swift");

  for (const outputSpec of config.outputs) {
    const shotPath = path.resolve(configDir, outputSpec.shot);
    const outPath = path.resolve(configDir, outputSpec.file);
    fs.mkdirSync(dirname(outPath), { recursive: true });
    const spec = buildSpec(outputSpec, config.brand, fontFile);
    try {
      const stdout = execFileSync(
        "swift",
        [kernel, layoutCommand(outputSpec.layout), shotPath, outPath],
        { input: JSON.stringify(spec), encoding: "utf8", stdio: ["pipe", "pipe", "inherit"] },
      );
      process.stdout.write(stdout);
    } catch (err) {
      process.exit(err.status ?? 1);
    }
  }
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  main();
}
