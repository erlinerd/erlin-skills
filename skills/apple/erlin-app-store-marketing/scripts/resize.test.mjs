#!/usr/bin/env node
// resize.mjs 纯函数测试（对应原 test_resize.py 的两个意图）：
// 1) 纵横比匹配 → 按目标尺寸重采样不拉伸；2) 纵横比差 >1% → 硬失败不产出文件。
// plan() 是脚本的核心决策（裁切计划 + 守卫），直接注入尺寸测试，无需真跑 sips。

import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultOutputPath, plan } from "./resize.mjs";

test("纵横比匹配时裁切计划保持原尺寸，输出为目标尺寸", () => {
  assert.deepEqual(plan("source.png", 50, 100, { w: 100, h: 200 }), {
    cropW: 100,
    cropH: 200,
    outW: 50,
    outH: 100,
  });
});

test("纵横比差 >1% 时拒绝（守卫在产出任何文件之前）", () => {
  assert.throws(() => plan("source.png", 50, 100, { w: 100, h: 100 }), /差 >1%/);
});

test("差 <1% 但不相等时做中心裁切补齐", () => {
  // 源 201x200 (1.005) vs 目标 1:1：差 0.5% <1%，允许，裁宽到 200
  assert.deepEqual(plan("a.png", 200, 200, { w: 201, h: 200 }), {
    cropW: 200,
    cropH: 200,
    outW: 200,
    outH: 200,
  });
  // 源 200x201 vs 目标 1:1：差 0.5%，裁高到 200
  assert.deepEqual(plan("a.png", 200, 200, { w: 200, h: 201 }), {
    cropW: 200,
    cropH: 200,
    outW: 200,
    outH: 200,
  });
});

test("默认输出名跟随源后缀并带尺寸标签", () => {
  assert.equal(defaultOutputPath("/tmp/shots/01.png", 1290, 2796), "/tmp/shots/01_1290x2796.png");
});
