#!/usr/bin/env node
// compose.mjs 布局算法测试（对应原 test_compose.py 的 DrawStub 手法：
// 度量函数注入 stub，验证换行算法本身而非字体渲染）。

import { test } from "node:test";
import assert from "node:assert/strict";
import { wordWrap } from "./compose.mjs";

const stubMeasure = async (text) => text.length; // 与 python DrawStub.textlength=len(text) 一致

test("无空格 CJK 按最大宽逐字断行", async () => {
  assert.deepEqual(await wordWrap("同步你的数据和设置", stubMeasure, 4), ["同步你的", "数据和设", "置"]);
});

test("超长无空格 token 折行后残余继续成行", async () => {
  assert.deepEqual(await wordWrap("ABCDEFGHIJ", stubMeasure, 4), ["ABCD", "EFGH", "IJ"]);
});

test("空格分词在宽度约束下拼行，放不下才换行", async () => {
  const measure = async (text) => text.length;
  assert.deepEqual(await wordWrap("ab cd ef gh", measure, 5), ["ab cd", "ef gh"]);
});
