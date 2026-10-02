#!/usr/bin/env node
// 将原生截图等比缩放到 App Store 规格尺寸（本 skill 截图管线用，见 SKILL.md Part A A3）。
//
// 用法:
//   node resize.mjs <输入.png> <宽> <高> [输出.png]
//
// - 无输出路径时输出到 <输入去后缀>_<宽>x<高>.png
// - 先中心裁切到目标纵横比，再等比缩放；源与目标纵横比差 >1% 时失败
// - 图像操作走 macOS 原生 sips（零 npm 依赖）

import { execFileSync } from "node:child_process";
import { basename, extname, join } from "node:path";

function sips(args) {
  return execFileSync("/usr/bin/sips", args, { encoding: "utf8" });
}

function dimensions(path) {
  const out = sips(["-g", "pixelWidth", "-g", "pixelHeight", path]);
  const w = Number(out.match(/pixelWidth: (\d+)/)?.[1]);
  const h = Number(out.match(/pixelHeight: (\d+)/)?.[1]);
  if (!w || !h) throw new Error(`无法读取图片尺寸: ${path}`);
  return { w, h };
}

export function defaultOutputPath(src, w, h) {
  const ext = extname(src);
  return join(
    src.slice(0, -ext.length || undefined) || src,
    "..",
    `${basename(src, ext)}_${w}x${h}${ext}`,
  );
}

export function plan(src, w, h, dims = dimensions(src)) {
  const ratioSrc = dims.w / dims.h;
  const ratioDst = w / h;
  const ratioDelta = Math.abs(ratioSrc - ratioDst) / ratioDst;
  if (ratioDelta > 0.01) {
    throw new Error(
      `源纵横比 ${ratioSrc.toFixed(4)} 与目标 ${ratioDst.toFixed(4)} 差 >1%，请重新选择规格档位`,
    );
  }
  // sips -c 是中心裁切；先裁到目标纵横比，再重采样到精确尺寸
  let cropW = dims.w;
  let cropH = dims.h;
  if (ratioSrc > ratioDst) cropW = Math.round(dims.h * ratioDst);
  else if (ratioSrc < ratioDst) cropH = Math.round(dims.w / ratioDst);
  return { cropW, cropH, outW: w, outH: h };
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("用法: node resize.mjs <输入.png> <宽> <高> [输出.png]");
    process.exit(1);
  }
  const [src, wStr, hStr, outArg] = args;
  const w = Number(wStr);
  const h = Number(hStr);
  const out = outArg ?? defaultOutputPath(src, w, h);
  try {
    const dims = dimensions(src);
    const { cropW, cropH, outW, outH } = plan(src, w, h, dims);
    sips(["-c", String(cropH), String(cropW), src, "--out", out]);
    sips(["-z", String(outH), String(outW), out]);
    console.log(`${src} -> ${out} (${dims.w}x${dims.h} -> ${outW}x${outH})`);
  } catch (err) {
    console.error(`错误: ${err.message}`);
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  main();
}
