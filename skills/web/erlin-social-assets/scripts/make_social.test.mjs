import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSpec, discoverFont, hexToRgb, layoutCommand, resolveColor } from "./make_social.mjs";

// config.example.json 同时充当 fixture：测试品牌色解析与 kernel spec 组装不漂移
const exampleConfig = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "config.example.json"), "utf8"),
);

test("hexToRgb 解析 #RRGGBB 与裸 RRGGBB", () => {
  assert.deepEqual(hexToRgb("#E05440"), [224, 84, 64]);
  assert.deepEqual(hexToRgb("e05440"), [224, 84, 64]);
});

test("hexToRgb 拒绝非 6 位 hex", () => {
  assert.throws(() => hexToRgb("#FFF"), /无效颜色值/);
  assert.throws(() => hexToRgb("#GGGGGG"), /无效颜色值/);
});

test("resolveColor 品牌键优先、原样 hex 兜底", () => {
  const brand = exampleConfig.brand;
  assert.deepEqual(resolveColor(brand, "accent"), [224, 84, 64]);
  assert.deepEqual(resolveColor(brand, "#292623"), [41, 38, 35]);
});

test("discoverFont 按序取第一个存在的候选；全缺时报错", () => {
  const candidates = ["/no/a.ttc", "/yes/b.ttc", "/yes/c.ttc"];
  assert.equal(discoverFont(candidates, (p) => p === "/yes/b.ttc"), "/yes/b.ttc");
  assert.throws(() => discoverFont(["/no/a.ttc"], () => false), /找不到可用中文字体/);
});

test("layoutCommand: wide → render-wide，其余归 vertical", () => {
  assert.equal(layoutCommand("wide"), "render-wide");
  assert.equal(layoutCommand("vertical"), "render-vertical");
  assert.equal(layoutCommand(undefined), "render-vertical");
});

test("buildSpec 契约：默认值、品牌键与 hex 两种 title2Color、motif 全量映射", () => {
  const brand = exampleConfig.brand;
  const fontFile = "/System/Library/Fonts/PingFang.ttc";

  const vertical = buildSpec(exampleConfig.outputs[0], brand, fontFile);
  assert.equal(vertical.decor, "dots");
  assert.deepEqual(vertical.title2Color, [224, 84, 64]); // title2Color: "accent" 品牌键
  assert.deepEqual(vertical.background, [244, 241, 231]); // "#F4F1E7"
  assert.deepEqual(vertical.motif[0], [224, 84, 64]);
  assert.deepEqual(vertical.motif[6], [140, 107, 177]);
  assert.equal(vertical.fontFile, fontFile);
  assert.equal(vertical.fileName, "out/xhs-1242x1660.png");
  assert.equal(vertical.logoText, "拼豆图纸");

  const wide = buildSpec(exampleConfig.outputs[2], brand, fontFile);
  assert.deepEqual(wide.title2Color, [224, 84, 64]); // 缺省回退 accent
  assert.equal(wide.logoText, null);
  assert.equal(wide.footer, "本地生成 · 不上传 · PNG / PDF");
});
