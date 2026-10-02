---
name: erlin-asc
maturity: engineering
description: >-
  App Store Connect API CLI: create and manage App records, Bundle IDs, localized names; look up Apps and Builds; prepare for release. Keys live in an XDG JSON config (paths only, never key contents). Use for "create an app", "App Store Connect", release prep. Explicit user invocation only; confirm before writes. App Store Connect API 命令行工具。当用户要创建/管理 ASC 的 App 记录、Bundle ID、多语言名称、查 App 或 Build，或提到"建 App/上架准备"时使用。配置存 XDG JSON（只存密钥路径，不存密钥内容）。仅用户显式调用；写操作先确认。
when_to_use: 创建/管理 App Store Connect 的 App 记录、Bundle ID、多语言名称，查询 App 或 Build，做上架准备与 ASC 相关操作时使用；提及"建 App/上架准备/App Store Connect"即触发。**本技能写外部 ASC 记录，仅用户显式调用时执行，模型不自动触发。**
disable-model-invocation: true
keywords:
  - App Store Connect
  - ASC
  - 建 App
  - 上架准备
  - 多语言名称
  - App 记录
  - 查 App
---

erlin-asc — App Store Connect API CLI

# 目标

官方 REST API 的薄封装（零依赖 Node 脚本）：ES256 JWT 签名 + 请求一步完成，绕开浏览器自动化的一切坑。用于创建/管理 ASC 的 App 记录、Bundle ID、多语言名称，查 App 或 Build，做上架准备。

# 执行步骤

脚本在 `<skill 目录>/scripts/asc.mjs`：

```bash
asc.mjs check            # 鉴权自检
# 创建 App 记录（自动注册缺失的 Bundle ID）:
asc.mjs create-app --name "示例App" --bundle com.example.myapp --sku MYAPP001 --locale zh-Hans
# 给 App 挂本地化名称:
asc.mjs add-locale --app-id <AppID数字> --locale en-US --name "MyApp EN"
# 任意 API 调用:
asc.mjs req GET "/v1/apps?limit=10"
asc.mjs req POST /v1/apps '{"data":{...}}'
```

ASC 常用 locale 码：`zh-Hans` 简体中文、`zh-Hant` 繁体中文、`en-US` 美式英语。

配置（XDG，只存路径）：配置文件 `$XDG_CONFIG_HOME/asc/config.json`（默认 `~/.config/asc/config.json`，可用环境变量 `ASC_CONFIG` 覆盖）：

```json
{"issuer_id":"<Issuer ID>","key_id":"<Key ID>","key_path":"/绝对路径/AuthKey_XXX.p8"}
```

用户不知道怎么配置时，按此引导：

1. 浏览器打开 App Store Connect → **用户和访问** → **集成** → **App Store Connect API**
2. **生成 API 密钥**：名称随意，角色必须选 **管理员（Admin）**——App 管理者（App Manager）无权创建 App 记录，调用会 403 "does not allow CREATE"
3. 下载 `.p8`（**只能下载一次**）→ 挪到私有目录 → `chmod 600`
4. 收集页面顶部的 **Issuer ID** 和密钥列表里的 **Key ID**
5. 写配置文件（`mkdir -p ~/.config/asc` 后写入上面格式的 JSON）
6. 验证：`node <skill 目录>/scripts/asc.mjs check`，输出 `鉴权 OK` 即成

# 判断规则

实战已知坑：

- `POST /v1/apps` 需 **Admin/Account Holder** 角色；App Manager 角色调 403 "does not allow CREATE"（创建密钥时角色务必选管理员；密钥生成后角色可再编辑）
- 创建 App 记录前 Bundle ID 必须已在开发者门户注册（`create-app` 已内置自动注册，409=已存在忽略）
- App Store 名称在同一店面冲突会创建失败，先查重再定名
- ASC 网页版 + 自动化组合极不稳定（空壳页/自绘菜单点不中）——**能走 API 就别碰浏览器**
- ASC 网页连续快速加载可能触发限流空壳，等待或换会话可恢复
- 启用 App Groups 能力的 App ID 可能无法删除（"appears to be in use"），需先从 App Group 移除
- 上过架/TestFlight 的 Bundle ID 永久保留，删除 App ID 不释放
- Hama、Perler 是注册商标，拼豆类 App 名与文案只用 fuse bead / 拼豆

App Store 三技能互引：ASC 记录/Bundle 操作 → `erlin-asc`；截图物料/营销构图 → `erlin-app-store-marketing`；被拒整改/提审自查 → `erlin-app-store-compliance`。


# 输出格式

- 命令结果即交付：`asc.mjs check` 成功输出 `鉴权 OK`；`create-app` 成功即建好 App 记录并自动注册缺失 Bundle ID；`req` 返回 ASC API 原始响应。
- 无额外报告模板。（本技能无此环节的独立产物结构）

# 示例

## 用户问题

"帮我把新 App 建到 App Store Connect 上做上架准备：bundle 是 com.example.myapp，中文名"示例App"，再加一个英文名。"

## 工具返回

### asc.mjs check

输出 `鉴权 OK`。

### asc.mjs create-app

`asc.mjs create-app --name "示例App" --bundle com.example.myapp --sku MYAPP001 --locale zh-Hans` → 创建成功，返回 App ID；缺失的 Bundle ID 已自动注册。

### asc.mjs add-locale

`asc.mjs add-locale --app-id <AppID数字> --locale en-US --name "MyApp EN"` → 本地化名称挂载成功。

### asc.mjs req

`asc.mjs req GET "/v1/apps?limit=10"` → 返回 App 列表 JSON，能看到新建记录。

## 最终输出

- ASC 上可用的 App 记录（含自动注册的 Bundle ID）+ zh-Hans / en-US 双语名称；拿到 App ID 即可继续后续上架操作。

# 门禁

- **写操作确认闸**：create-app、改名称、删改记录等一切写入 ASC 的操作，执行前向用户复述目标对象与字段，确认后才调 API；只读查询（查 App/Build）不必确认。
- 铁律：**只存 .p8 的路径，绝不把密钥内容写进配置、脚本或任何仓库**。密钥本体放私有目录并 `chmod 600`。
- API 密钥角色必须是管理员（Admin）；App Manager 无权创建 App 记录。
- `.p8` 只能下载一次，下载后立即挪私有目录并收紧权限。
- 能走 API 就别碰浏览器自动化。
