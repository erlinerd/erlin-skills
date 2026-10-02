#!/usr/bin/env node
// verify_icon.mjs 的行为测试（替代原 test_verify_icon.py；
// 夹具由 icon_raster.swift 的 fixture 子命令绘制，走真实 CLI 验证文案与退出码）。
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const verifyScript = fileURLToPath(new URL("./verify_icon.mjs", import.meta.url));
const rasterKernel = fileURLToPath(new URL("./icon_raster.swift", import.meta.url));

function makeIcon(directory, name, { offset = 0, accent = false, size = 1024, ink = true } = {}) {
  const path = join(directory, name);
  const result = spawnSync(
    "swift",
    [rasterKernel, "fixture", path, String(offset), accent ? "1" : "0", String(size), ink ? "1" : "0"],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  return path;
}

function runVerify(paths, { requireAccent = false } = {}) {
  const args = [verifyScript, ...(requireAccent ? ["--require-accent"] : []), ...paths];
  return spawnSync(process.execPath, args, { encoding: "utf8" });
}

test("拒绝错误尺寸与缺失文字墨迹", () => {
  const directory = mkdtempSync(join(tmpdir(), "verify-icon-"));
  try {
    const wrongSize = makeIcon(directory, "wrong.png", { size: 512, ink: false });
    const missingInk = makeIcon(directory, "empty.png", { ink: false });

    const result = runVerify([wrongSize, missingInk]);

    assert.notEqual(result.status, 0);
    assert.ok(result.stderr.includes("尺寸必须是 1024x1024"), result.stderr);
    assert.ok(result.stderr.includes("未找到文字墨迹"), result.stderr);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("拒绝偏心文字墨迹并校验 --require-accent", () => {
  const directory = mkdtempSync(join(tmpdir(), "verify-icon-"));
  try {
    const offCenter = makeIcon(directory, "off-center.png", { offset: 20 });
    const noAccent = makeIcon(directory, "no-accent.png");
    const withAccent = makeIcon(directory, "with-accent.png", { accent: true });

    const offCenterResult = runVerify([offCenter]);
    const missingAccentResult = runVerify([noAccent], { requireAccent: true });
    const validResult = runVerify([withAccent], { requireAccent: true });

    assert.notEqual(offCenterResult.status, 0);
    assert.ok(offCenterResult.stderr.includes("中心偏差超过 2px"), offCenterResult.stderr);
    assert.notEqual(missingAccentResult.status, 0);
    assert.ok(missingAccentResult.stderr.includes("未找到强调色"), missingAccentResult.stderr);
    assert.equal(validResult.status, 0, validResult.stderr);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("强调元素对齐门禁：偏离目标字形中心超容差即失败", () => {
  const directory = mkdtempSync(join(tmpdir(), "verify-icon-"));
  try {
    // fixture 强调圆固定在 (480,480)-(544,544)，中心 (512,512)；
    // 目标字形中心设为 (500,512) → x 差 +12 > 容差 1，必须失败（旧实现只打印不判定 = 假绿）
    const withAccent = makeIcon(directory, "accent-target.png", { accent: true });
    const failed = spawnSync(process.execPath, [verifyScript, "--accent-target", "500,512,1", withAccent], { encoding: "utf8" });
    assert.notEqual(failed.status, 0);
    assert.ok(failed.stdout.includes("强调元素 vs 目标字形中心"), failed.stdout);
    assert.ok(failed.stderr.includes("偏离目标字形"), failed.stderr);

    // 目标与实际重合 (512,512) → 通过
    const passed = spawnSync(process.execPath, [verifyScript, "--accent-target", "512,512,1", withAccent], { encoding: "utf8" });
    assert.equal(passed.status, 0, passed.stdout + passed.stderr);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
