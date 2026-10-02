#!/usr/bin/env node
// erlin-asc — App Store Connect API CLI（官方 REST API 薄封装，零依赖）
//
// 用法:
//   asc.mjs check                                   鉴权自检
//   asc.mjs create-app --name <名> --bundle <id> --sku <sku> [--locale zh-Hans]
//                                                   注册 Bundle ID（如缺）→ 创建 App 记录
//   asc.mjs add-locale --app-id <id> --locale en-US --name <名>
//                                                   给 App 增加本地化名称
//   asc.mjs req <METHOD> <path> [json-body]         任意 API 调用
//
// 配置: $XDG_CONFIG_HOME/asc/config.json（默认 ~/.config/asc/config.json）
//   {"issuer_id":"...","key_id":"...","key_path":"..."}   ← 只存路径，不存密钥内容
import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import crypto from 'node:crypto';

const API = 'https://api.appstoreconnect.apple.com';
const cfgPath =
  process.env.ASC_CONFIG ??
  join(process.env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'asc', 'config.json');

function setupGuide() {
  console.error(`配置不存在: ${cfgPath}
按以下步骤配置（一次性）:
1. 浏览器打开 App Store Connect → 用户和访问 → 集成 → App Store Connect API
2. 生成 API 密钥: 角色必须选「管理员」(App Manager 无权创建 App 记录，会 403)
3. 下载 .p8（只能下载一次）→ 挪到私有目录 → chmod 600
4. 收集页面顶部的 Issuer ID 和密钥的 Key ID
5. 写配置:
   mkdir -p ~/.config/asc
   cat > ~/.config/asc/config.json <<'EOF'
   {"issuer_id":"<Issuer ID>","key_id":"<Key ID>","key_path":"/path/to/AuthKey_XXX.p8"}
   EOF`);
  process.exit(1);
}

function loadCfg() {
  if (!existsSync(cfgPath)) setupGuide();
  const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
  cfg.key_path = cfg.key_path.replace(/^~(?=\/|$)/, homedir());
  if (!existsSync(cfg.key_path)) {
    console.error(`密钥文件不存在: ${cfg.key_path}`);
    process.exit(1);
  }
  return cfg;
}

function jwt(cfg) {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const header = b64({ alg: 'ES256', kid: cfg.key_id, typ: 'JWT' });
  const payload = b64({ iss: cfg.issuer_id, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' });
  const input = `${header}.${payload}`;
  const der = crypto.sign('sha256', Buffer.from(input), crypto.createPrivateKey(readFileSync(cfg.key_path, 'utf8')));
  // DER → JWT 要求的 raw r||s（各 32 字节）；r/s 带前导零需剥离，不足 32 字节需左侧补零
  let i = 2;
  if (der[1] & 0x80) i += der[1] & 0x7f;
  i += 2;
  let r = der.subarray(i, i + der[i - 1]);
  i += r.length + 2;
  let s = der.subarray(i, i + der[i - 1]);
  const fix = (b) => (b.length > 32 ? b.subarray(b.length - 32) : Buffer.concat([Buffer.alloc(32 - b.length), b]));
  return `${input}.${Buffer.concat([fix(r), fix(s)]).toString('base64url')}`;
}

async function api(cfg, method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: {
      Authorization: `Bearer ${jwt(cfg)}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, json };
}

function flag(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}

const [cmd, ...rest] = process.argv.slice(2);
const cfg = loadCfg();

if (cmd === 'check') {
  const r = await api(cfg, 'GET', '/v1/apps?limit=1');
  console.log(`HTTP ${r.status} — ${r.ok ? '鉴权 OK，密钥可用' : JSON.stringify(r.json)}`);
  process.exit(r.ok ? 0 : 1);
} else if (cmd === 'req') {
  const [method = 'GET', path, bodyRaw] = rest;
  const r = await api(cfg, method.toUpperCase(), path, bodyRaw ? JSON.parse(bodyRaw) : undefined);
  console.log(`HTTP ${r.status}`);
  console.log(JSON.stringify(r.json, null, 2));
} else if (cmd === 'create-app') {
  const bundle = flag('bundle');
  const name = flag('name');
  const sku = flag('sku');
  const locale = flag('locale') ?? 'zh-Hans';
  if (!bundle || !name || !sku) {
    console.error('usage: asc.mjs create-app --name <名> --bundle <id> --sku <sku> [--locale zh-Hans]');
    process.exit(1);
  }
  // 1) Bundle ID 未注册则注册（409 = 已存在，忽略）
  let r = await api(cfg, 'POST', '/v1/bundleIds', {
    data: { type: 'bundleIds', attributes: { identifier: bundle, platform: 'ios', name: bundle } },
  });
  console.log(`Bundle ID 注册: HTTP ${r.status} ${r.ok ? '(新注册)' : r.status === 409 ? '(已存在)' : JSON.stringify(r.json)}`);
  // 2) 创建 App 记录（需要 Admin 角色）
  r = await api(cfg, 'POST', '/v1/apps', {
    data: { type: 'apps', attributes: { name, primaryLocale: locale, sku, bundleId: bundle } },
  });
  if (!r.ok) {
    console.log(`HTTP ${r.status}\n${JSON.stringify(r.json, null, 2)}`);
    process.exit(1);
  }
  const id = r.json.data.id;
  console.log(`✅ App 创建成功: ${name} (${bundle})`);
  console.log(`   App ID: ${id}`);
  console.log(`   链接: https://appstoreconnect.apple.com/ios/apps/${id}/distribution`);
} else if (cmd === 'add-locale') {
  const appId = flag('app-id');
  const locale = flag('locale');
  const name = flag('name');
  if (!appId || !locale || !name) {
    console.error('usage: asc.mjs add-locale --app-id <id> --locale en-US --name <名>');
    process.exit(1);
  }
  const infos = await api(cfg, 'GET', `/v1/apps/${appId}/appInfos`);
  const appInfoId = infos.json.data?.[0]?.id;
  if (!appInfoId) { console.error('appInfo 未找到'); process.exit(1); }
  const r = await api(cfg, 'POST', '/v1/appInfoLocalizations', {
    data: {
      type: 'appInfoLocalizations',
      attributes: { locale, name },
      relationships: { appInfo: { data: { type: 'appInfos', id: appInfoId } } },
    },
  });
  console.log(`HTTP ${r.status} ${r.ok ? `✅ ${locale} 本地化名「${name}」已挂` : JSON.stringify(r.json)}`);
  if (!r.ok) process.exit(1);
} else {
  console.error('用法: asc.mjs <check|create-app|add-locale|req> [参数]');
  process.exit(1);
}
