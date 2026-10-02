#!/usr/bin/env node
// asc.mjs DER→raw 签名转换的行为测试：合成 ECDSA DER + 真实 P-256 签名，
// 断言 fix() 每侧恒为 32 字节——低值 r/s（DER 编码短于 32 字节）左补零；
// 高位 r/s（DER 先补 0x00 垫片成 33 字节整数）剥离垫片后为 32 字节原样直通
// （旧实现既不左补零也不剥垫片 → raw 长度错位 → 签名无效）。
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("./asc.mjs", import.meta.url));

function derInt(bytes) {
  let i = 0;
  while (i < bytes.length && bytes[i] === 0) i += 1; // 去多余前导零
  const v = bytes.subarray(i);
  const padded = v.length && v[0] & 0x80 ? Buffer.concat([Buffer.alloc(1), v]) : v;
  return Buffer.concat([Buffer.from([0x02, padded.length]), padded]);
}

// 低值 r/s 经 derInt 剥掉全部前导零后，最小 DER 编码内容仅 1/2 字节（< 32）→ 触发 fix 的左补零路径，恢复到 32 字节
const LOW_R = Buffer.from(Array(31).fill(0).concat([0x01]));
const HIGH_R = Buffer.concat([Buffer.alloc(1, 0xff), Buffer.alloc(31, 0xab)]); // 32 字节、首字节高位
const LOW_S = Buffer.from(Array(30).fill(0).concat([0x02, 0x03]));
const HIGH_S = Buffer.concat([Buffer.alloc(1, 0x80), Buffer.alloc(31, 0xcd)]);

function buildDer(r, s) {
  const body = Buffer.concat([derInt(r), derInt(s)]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

function signatureFor(der) {
  // asc.mjs 顶层即执行主流程、无法 import；这里读源码用正则截取 jwt() 内的 const fix 一行，在临时 probe.mjs 中配合手抄的 DER 解析段（对应 asc.mjs 的 DER→r/s 剥离段）运行——手抄副本：asc.mjs 改解析逻辑时本测试不会自动跟进，仅 fix 一行会被重新提取。
  // 真实 P-256 多轮签名覆盖见下方第三个用例。
  const dir = mkdtempSync(join(tmpdir(), "asc-sig-"));
  try {
    const probe = join(dir, "probe.mjs");
    const src = execFileSync("node", ["-e", `process.stdout.write(require('fs').readFileSync(${JSON.stringify(script)},'utf8'))`]);
    // 截取 jwt() 中的 DER→raw 段落做独立执行（fix 函数 + concat），避免触发 main 流程
    const fixSource = /const fix = \(([^)]*)\) => ([^;]+);/.exec(src)[0];
    writeFileSync(
      probe,
      `import crypto from 'node:crypto';
       const fix = ${fixSource.replace(/^const fix = /, "").replace(/;$/, "")};
       const der = Buffer.from(${JSON.stringify(der.toString("hex"))}, 'hex');
       let i = 2;
       if (der[1] & 0x80) i += der[1] & 0x7f;
       i += 2;
       let r = der.subarray(i, i + der[i - 1]);
       i += r.length + 2;
       let s = der.subarray(i, i + der[i - 1]);
       const raw = Buffer.concat([fix(r), fix(s)]);
       console.log(JSON.stringify({ rLen: fix(r).length, sLen: fix(s).length, rawHex: raw.toString('hex') }));`,
    );
    const out = execFileSync(process.execPath, [probe], { encoding: "utf8" });
    return JSON.parse(out);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("低值 r/s 左补零到 32 字节", () => {
  const { rLen, sLen, rawHex } = signatureFor(buildDer(LOW_R, LOW_S));
  assert.equal(rLen, 32);
  assert.equal(sLen, 32);
  assert.equal(rawHex.length, 128);
  assert.ok(rawHex.startsWith("00".repeat(31) + "01"), "r 应为左补零后的 0…01");
});

test("高位 r/s 剥离 DER 前导零后保持 32 字节", () => {
  const { rLen, sLen, rawHex } = signatureFor(buildDer(HIGH_R, HIGH_S));
  assert.equal(rLen, 32);
  assert.equal(sLen, 32);
  assert.equal(rawHex, Buffer.concat([HIGH_R, HIGH_S]).toString("hex"));
});

test("真实 P-256 签名经 fix 后恒为 64 字节 raw", () => {
  // 用真实曲线签名统计多轮，覆盖 r/s 长度抖动（每轮 1/2 概率高位为 1）
  const { privateKey } = crypto.generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const dir = mkdtempSync(join(tmpdir(), "asc-live-"));
  try {
    const pemPath = join(dir, "key.pem");
    writeFileSync(pemPath, privateKey.export({ type: "sec1", format: "pem" }));
    const probe = join(dir, "probe.mjs");
    const src = execFileSync("node", ["-e", `process.stdout.write(require('fs').readFileSync(${JSON.stringify(script)},'utf8'))`]);
    const fixSource = /const fix = \(([^)]*)\) => ([^;]+);/.exec(src)[0];
    writeFileSync(
      probe,
      `import crypto from 'node:crypto';
       import { readFileSync } from 'node:fs';
       const fix = ${fixSource.replace(/^const fix = /, "").replace(/;$/, "")};
       const key = crypto.createPrivateKey(readFileSync(${JSON.stringify(pemPath)}, 'utf8'));
       for (let n = 0; n < 24; n++) {
         const der = crypto.sign('sha256', Buffer.from(String(n)), key);
         let i = 2;
         if (der[1] & 0x80) i += der[1] & 0x7f;
         i += 2;
         let r = der.subarray(i, i + der[i - 1]);
         i += r.length + 2;
         let s = der.subarray(i, i + der[i - 1]);
         const raw = Buffer.concat([fix(r), fix(s)]);
         if (raw.length !== 64) { console.error('round ' + n + ' raw length ' + raw.length); process.exit(1); }
       }
       console.log('ok');`,
    );
    const out = execFileSync(process.execPath, [probe], { encoding: "utf8" });
    assert.equal(out.trim(), "ok");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// 配置路径三级回退：ASC_CONFIG > $XDG_CONFIG_HOME/asc > ~/.config/asc
// 借 setupGuide 的报错回显（配置不存在: <cfgPath>）做黑盒断言，无需真实密钥/网络。
// HOME 指向临时目录，保证「无覆盖」用例不会撞上开发机上的真实配置而发起 API 调用。
const fakeHome = mkdtempSync(join(tmpdir(), "asc-home-"));
function cfgPathWith(env) {
  const out = (() => {
    try {
      return execFileSync(process.execPath, [script, "check"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        env: { PATH: process.env.PATH, HOME: fakeHome, ...env },
      });
    } catch (e) {
      return (e.stdout ?? "") + (e.stderr ?? "");
    }
  })();
  return /配置不存在: (.+)/.exec(out)?.[1].trim();
}

test("ASC_CONFIG 环境变量优先于一切", () => {
  const p = cfgPathWith({ ASC_CONFIG: "/tmp/custom-asc.json" });
  assert.equal(p, "/tmp/custom-asc.json");
});

test("XDG_CONFIG_HOME 生效（SKILL.md 承诺的 XDG 语义）", () => {
  const p = cfgPathWith({ XDG_CONFIG_HOME: "/tmp/xdg-root" });
  assert.equal(p, join("/tmp/xdg-root", "asc", "config.json"));
});

test("无覆盖时回退 ~/.config/asc/config.json", () => {
  const p = cfgPathWith({});
  assert.equal(p, join(fakeHome, ".config", "asc", "config.json"));
});
