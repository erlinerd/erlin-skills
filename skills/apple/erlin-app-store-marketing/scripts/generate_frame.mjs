#!/usr/bin/env node
// 生成 iPhone 设备框模板 PNG（compose.mjs 的叠加素材）；尺寸常量以 raster.swift runFrame 为准，compose.mjs 的 DEVICE_* 与之对应。
// 栅格化走 swift 内核（raster.swift frame）。
// 用法: node generate_frame.mjs [输出.png]，默认写到本 skill 的 assets/device_frame.png。

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runKernel } from "./kernel.mjs";

const DEFAULT_OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "assets", "device_frame.png");

const out = process.argv[2] ?? DEFAULT_OUT;
runKernel("frame", null, [out]);
console.log(`✓ ${out} (1030×2800)`);
console.log("  BEZEL=15, SCREEN_W=1000, SCREEN_H=2770");
console.log("  SCREEN_CORNER_R=62");
