#!/usr/bin/env node
// App 图标像素级验证（node + swift 扫描内核 icon_raster.swift，替代原 verify_icon.py）。
//
// 用法:
//   node verify_icon.mjs <图片路径>... [--require-accent]
//
// 扫描强调色(橙)/文字墨迹(暖白)像素 bbox,报告中心与理论中心(512)偏差。
// 判定标准: 文字墨迹中心 = 512±2(AA 光晕);强调元素中心 = 宿主字形腹腔中心 ±1。
// 注意: bbox 为顶部原点(y 向下);Vision OCR 的 bbox 原点在左下(y 向上),别混。
// 颜色判定阈值实现在 icon_raster.swift 的 scan 子命令（与 render_icon.mjs 共用,单一来源）。

import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KERNEL = join(dirname(fileURLToPath(import.meta.url)), "icon_raster.swift");

function scan(path) {
  return JSON.parse(
    execFileSync("swift", [KERNEL, "scan", path], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }),
  );
}

const fixed1 = (value) => value.toFixed(1);
const signed1 = (value) => (value < 0 ? "" : "+") + value.toFixed(1);

// 对一次扫描结果做全部判定: 返回 {lines, error}（error 即原 .py 的 ValueError 文本；
// lines 与原 .py 的 print 顺序逐字一致，error 抛出前的行都已产生）。
export function evaluate(result, path, { requireAccent = false, accentTarget = null, accentTolerance = 1 } = {}) {
  const { width, height, accent, ink } = result;
  const lines = [];
  if (width !== 1024 || height !== 1024) {
    return { lines, error: `${path}: 尺寸必须是 1024x1024，实际为 ${width}x${height}` };
  }
  lines.push(`=== ${path.split("/").pop()} ${width}x${height} ===`);
  if (accent) {
    const centerX = (accent[0] + accent[2]) / 2;
    const centerY = (accent[1] + accent[3]) / 2;
    lines.push(
      `  强调色 bbox: x[${accent[0]},${accent[2]}] y[${accent[1]},${accent[3]}] ` +
        `中心(${fixed1(centerX)},${fixed1(centerY)}) 偏差(${signed1(centerX - 512)},${signed1(centerY - 512)})`,
    );
  } else {
    lines.push("  强调色: 无");
  }
  if (!ink) {
    return { lines, error: `${path}: 未找到文字墨迹` };
  }
  const inkCenterX = (ink[0] + ink[2]) / 2;
  const inkCenterY = (ink[1] + ink[3]) / 2;
  lines.push(
    `  文字墨迹 bbox: x[${ink[0]},${ink[2]}] y[${ink[1]},${ink[3]}] ` +
      `中心(${fixed1(inkCenterX)},${fixed1(inkCenterY)}) 偏差(${signed1(inkCenterX - 512)},${signed1(inkCenterY - 512)})`,
  );
  if (Math.abs(inkCenterX - 512) > 2 || Math.abs(inkCenterY - 512) > 2) {
    return { lines, error: `${path}: 文字墨迹中心偏差超过 2px (${fixed1(inkCenterX)}, ${fixed1(inkCenterY)})` };
  }
  if (requireAccent && !accent) {
    return { lines, error: `${path}: 未找到强调色` };
  }
  // 强调元素对齐门禁：给定目标字形中心时，偏差超过容差即失败。
  // 注意「偏差」打印值相对画布中心 512；对齐判定看与 accentTarget 的差值（wordmark 中强调圆本就偏位）。
  if (accentTarget && accent) {
    const targetX = (accentTarget[0] + accentTarget[2]) / 2;
    const targetY = (accentTarget[1] + accentTarget[3]) / 2;
    const centerX = (accent[0] + accent[2]) / 2;
    const centerY = (accent[1] + accent[3]) / 2;
    const dx = centerX - targetX;
    const dy = centerY - targetY;
    lines.push(
      `  强调元素 vs 目标字形中心(${fixed1(targetX)},${fixed1(targetY)}): ` +
        `差值(${signed1(dx)},${signed1(dy)}) 容差±${accentTolerance}`,
    );
    if (Math.abs(dx) > accentTolerance || Math.abs(dy) > accentTolerance) {
      return { lines, error: `${path}: 强调元素中心偏离目标字形超过 ${accentTolerance}px (差值 ${signed1(dx)}, ${signed1(dy)})` };
    }
  }
  return { lines, error: null };
}

function main() {
  const argv = process.argv.slice(2);
  const requireAccent = argv.includes("--require-accent");
  // --accent-target x,y[,tol]：目标字形中心点与容差（px），启用强调元素对齐门禁
  const targetIdx = argv.indexOf("--accent-target");
  let accentTarget = null;
  let accentTolerance = 1;
  if (targetIdx >= 0) {
    const spec = (argv[targetIdx + 1] ?? "").split(",").map(Number);
    if (spec.length >= 2 && spec.slice(0, 2).every((n) => Number.isFinite(n))) {
      // evaluate 里与 bbox 中心比较，这里把中心点展开成等价 bbox
      const [cx, cy] = spec;
      accentTarget = [cx, cy, cx, cy];
      if (spec.length === 3 && Number.isFinite(spec[2])) accentTolerance = spec[2];
    }
  }
  const flagSet = new Set(["--require-accent", "--accent-target"]);
  const paths = argv.filter((arg, i) => !flagSet.has(arg) && (targetIdx < 0 || i !== targetIdx + 1));
  if (paths.length === 0) {
    console.log("用法: node verify_icon.mjs <图片路径>... [--require-accent] [--accent-target x,y[,tol]]");
    process.exit(1);
  }
  let failed = false;
  for (const path of paths) {
    try {
      const result = scan(path);
      const { lines, error } = evaluate(result, path, { requireAccent, accentTarget, accentTolerance });
      for (const line of lines) console.log(line);
      if (error) throw new Error(error);
    } catch (error) {
      console.error(`验证失败: ${error.message}`);
      failed = true;
    }
  }
  process.exit(failed ? 1 : 0);
}

main();
