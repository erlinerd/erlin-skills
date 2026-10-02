#!/usr/bin/env node
// asc.mjs DER→raw 签名转换的行为测试：合成 ECDSA DER 签名，断言 r/s 高位为零
// （第 8 位为 1 的 r 会产生 33 字节整数、剥离后剩 31 字节，旧实现左不补零 → 签名错位）。
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

// {0,…,1} 这样的低值 r 必然 < 2^248，编码后仅 31 字节 → 触发左补零路径
const LOW_R = Buffer.from(Array(31).fill(0).concat([0x01]));
const HIGH_R = Buffer.concat([Buffer.alloc(1, 0xff), Buffer.alloc(31, 0xab)]); // 32 字节、首字节高位
const LOW_S = Buffer.from(Array(30).fill(0).concat([0x02, 0x03]));
const HIGH_S = Buffer.concat([Buffer.alloc(1, 0x80), Buffer.alloc(31, 0xcd)]);

function buildDer(r, s) {
  const body = Buffer.concat([derInt(r), derInt(s)]);
  return Buffer.concat([Buffer.from([0x30, body.length]), body]);
}

function signatureFor(der) {
  // 通过 crypto.sign 的同一转换路径：临时导入 asc.mjs 不可行（顶层执行），
  // 故用 spawn 跑一段内联脚本 import 其 jwt 同款逻辑不现实 → 直接复刻调用：
  // asc.mjs 的 fix 逻辑通过签一个真实 P-256 密钥并打补丁验证代价高，
  // 这里改为对脚本做最小导入替代：提取 fix 行为做黑盒等价验证。
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
