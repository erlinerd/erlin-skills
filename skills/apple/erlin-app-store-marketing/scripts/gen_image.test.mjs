#!/usr/bin/env node
// gen_image.mjs 校验函数单元测试（不触网）：proxy URL 校验 + 输出路径沙箱。
// 校验器是信任边界：环境变量与 CLI 参数都属外部输入，逃逸 cwd 的路径必须拒绝。

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkedPath, validateProxyUrl } from "./gen_image.mjs";

test("proxy URL 接受 http/https", () => {
  assert.equal(validateProxyUrl("http://127.0.0.1:10100"), "http://127.0.0.1:10100");
  assert.equal(validateProxyUrl("https://proxy.example.com/v1"), "https://proxy.example.com/v1");
});

test("proxy URL 拒绝非 http(s) 与畸形 URL", () => {
  for (const bad of ["file:///etc/passwd", "ftp://x", "not a url", ""]) {
    assert.throws(() => validateProxyUrl(bad), /须为 http\/https URL/);
  }
});

test("checked_path 接受 cwd 内相对路径并解析为绝对路径", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-image-test-"));
  const previousCwd = process.cwd();
  process.chdir(tmp);
  try {
    assert.equal(
      checkedPath("screenshots/01-app/v1.png", "输出路径"),
      path.join(fs.realpathSync(tmp), "screenshots/01-app/v1.png"),
    );
  } finally {
    process.chdir(previousCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("checked_path 拒绝越界逃逸与 cwd 外绝对路径", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-image-test-"));
  const previousCwd = process.cwd();
  process.chdir(tmp);
  try {
    for (const bad of ["../escape.png", "/etc/passwd"]) {
      assert.throws(() => checkedPath(bad, "输出路径"), /越界/);
    }
  } finally {
    process.chdir(previousCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test("checked_path 拒绝 NUL 与目录", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "gen-image-test-"));
  const previousCwd = process.cwd();
  process.chdir(tmp);
  try {
    assert.throws(() => checkedPath("out\0.png", "输出路径"), /非法/);
    assert.throws(() => checkedPath(".", "输出路径"), /是目录/);
  } finally {
    process.chdir(previousCwd);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
