---
name: erlin-app-store-compliance
maturity: engineering
description: >-
  App Store rejection remediation (especially IAP: Guideline 4.10), pre-submission audits, and listing metadata localization (description/keywords/subtitle, en-US default). Use when rejected, before submitting, or when translating store copy. iOS App 被 App Store 审核拒绝（尤其 IAP/付费：Guideline 4.10）后的整改与提审前自查——Pro 卖点重定位为 App 自身高级体验，扫清禁用表达；并负责提审文案多语言化。用户说"被拒了""审核被拒""4.10""提审前查一遍""翻译 App Store 文案"时使用——即使没提 skill 名。
when_to_use: App 被拒审整改、提审前自查或提审文案多语言化时使用；用户说“被 App Store 拒了/审核被拒/4.10/不能卖 iCloud/订阅卖点整改/Pro 文案改改/提审前查一遍/翻译 App Store 文案/本地化商店元数据”即触发，无需点名本技能。范围含仓库外 RevenueCat Paywall / ASC IAP 商品的正确处理。
keywords:
  - App Store 拒了
  - 审核被拒
  - guideline 4.10
  - 不能卖 iCloud
  - 订阅卖点整改
  - Pro 文案改改
  - 提审前查一遍
  - App Store 描述
  - App Store 关键词
  - App Store 副标题
  - 推广文本
  - 提审信息
  - 商店元数据
  - App Store Connect 文案
  - 翻译 App Store 文案
requires: []
---

erlin-app-store-compliance — 拒审整改 + 商店文案多语言

# 目标

两个场景，先分清意图：

- **拒审整改**（默认场景）：解决"付费墙在卖系统能力"这类审核拒因——未知的不是技术，是**措辞与定位**。经济不敏感、可逆向（全改文案，不动收费逻辑）。
- **商店文案多语言**：把 App Store 提审信息从源语言翻译成目标语言，产出可直接粘贴的整套字段。拒审整改常与它连用：先定合规口径，再翻译。

场景一产出：六处售卖面的盘点 → 售卖/披露语境分类 → Pro 重定位文案 → 仓库内落地 → 禁用词扫描清零 → 仓库外手动清单。

场景二产出：ASC 版本页整套提审文案（描述、关键词、推广文本、副标题、新增内容）的目标语言版本，并做品牌与字符限制校验。只生成内容，不负责往 ASC 里填。

# 执行步骤

**场景一：拒审整改（IAP/订阅卖点）**

1. **盘点六处售卖面**（漏一处审核就可能再看一次）：
   - App 本地化：`Localizable.xcstrings` / `*.strings`——写脚本抽出键名+中英值，过滤 sync/iCloud/Pro/premium/同步/订阅/解锁。
   - SwiftUI：设置页 Pro 卡、同步入口行、Onboarding、订阅状态页。用 grep 定位 `Text("...")` / `NSLocalizedString`。
   - 官方 Paywall：RevenueCat Dashboard 或项目实际使用的 StoreKit/Paywall 服务（**服务端或配置端**——先检查仓库中的实际入口；只改本地占位 View 文案可能没用，审核员看的是最终渲染页面）。
   - App Store Connect：描述、截图 caption、促销文本、**IAP 商品显示名/描述**、App Review 备注。
   - 营销素材：remotion 项目的文案/数据源（demo 项目中为 `copy.ts`/`shotData.ts`）、社媒文案、官网（privacy 页里的事实披露别删）。
   - 已提交的渲染产物：`screenshots/*.png`、视频。文案源改了必须重渲，产物本身就带着旧文案。
2. **逐条分类**：不可判定就先保留并打标，绝不手滑删掉隐私披露或账号状态。
3. **重定位 Pro**：Pro = App 自身高级体验，给 2-3 个**真实存在**的权益。可复用模板：跨设备同步你的数据和设置 · 创建最多 99 个旅程 · 更多高级功能持续更新（en：Cross-device sync / Create up to 99 journeys / More premium features in future updates）。同步/卖点改用「跨设备同步 / Cloud sync / Sync across devices」这套词。
4. **仓库内落地**：
   - 改 xcstrings 用精准 Edit（匹配唯一 `"value": ...` 字符串，不整库 reformat，避免万行 diff）。改掉的键若不再被引用就删键，避免 stale。
   - 设置页把"一行卖点"换成权益列表（如 `✓` 行 + 新键 `pro.benefit.*`）。
   - 改 App Store 描述 / 截图 caption / App Review 备注模板 / 产品定位文档（口径一致，防止下个素材从旧文档抄回"卖 iCloud"）。
5. **扫描清零**：全仓库（swift/ts/md，含测试）grep `-rniE "unlock iCloud|解锁 iCloud|iCloud Premium|buy iCloud|access iCloud|Pro unlocks iCloud"` 确认空；剩余的 iCloud 技术性引用逐条理由留档。测试通常断言内部枚举而非 UI 文案，先 grep 确认要不要跟着改。
6. **给仓库外手动清单**（勾选式，交给用户）：RevenueCat Dashboard Paywall 文案；ASC IAP 商品名/描述；重渲截图/视频（本机 Node + remotion，改完 remotion 项目的文案/数据源（demo 项目中为 `copy.ts`/`shotData.ts`）后按项目 render 命令跑）；把新 ASC 描述填进 Connect 并提交。
7. **提审确认**：订阅/终身 IAP 必须在 ASC 已进入"可供审核"状态（否则先撞 2.1(b)）。

**场景二：商店文案多语言**

输入：

- 源文案：描述（description）、关键词（keywords）、推广文本（promotional text）、副标题（subtitle）、新增内容（what's new）。可从 ASC 页面读取，或由用户直接给出。
- 品牌依据：项目里若有 `docs/BRAND.md` 类文档，先读「App Store 文案框架」与「品牌红线」两节；没有就按门禁里的通用红线。

1. 读品牌文档（若存在），锁定语气与红线。
2. 确认源文案与目标语言（缺省 zh-Hans → en-US）。
3. 逐字段产出目标语言版本（结构与段落顺序保持一一对应，方便对照检查）。
4. 校验：
   - 描述 ≤ 4000 字符；关键词 ≤ 100 字符（逗号分隔、不重复、含空格计字符）；推广文本 ≤ 170；副标题 ≤ 30；新增内容 ≤ 4000。
   - 关键词按目标语言市场习惯重排，不只直译——例如中文关键词常含品类词，英文关键词要覆盖该市场实际搜索词（desk clock、flip clock、nightstand clock…）。
   - 翻译不逐字：保留源文案的「三场景/三特性」式结构即可，英文按英语语感重写，禁止翻译腔。
5. 输出：字段名 + 字数 + 全文，用户可直接复制进 ASC。

# 判断规则

**何时使用**

- iOS App（尤其含订阅/IAP）被拒，拒因约等于"The app charges users for access to built-in iOS capabilities"（Guideline 4.10），或任何"付费墙在卖平台自带能力"的表述。
- 提审前做订阅卖点自查（"上架前查一遍""Pro 文案检查"也触发）。
- 翻译/本地化 App Store 提审信息（描述、关键词、副标题、推广文本、新增内容）。
- 不适用：与文案无关的技术拒绝（崩溃、后台模式、权限）——那种走正常修 bug 流程；App 内 UI 国际化也不在本技能范围。

**核心判断（4.10）**

4.10 的靶子是"**卖**系统能力"，不是"**提**系统能力"。所以整改的两个动作缺一不可：

1. **清掉售卖语境**：任何把 iCloud/系统能力当 Pro 卖点的表述（付费墙、App Store 描述、截图 caption、营销素材、社媒）。
2. **保留披露语境**：账号状态（已登录 iCloud）、错误/降级提示（无法连接 iCloud）、启用确认（"数据会上传到你的私人 iCloud"）、隐私政策——这些是必须如实说明的机制与隐私披露，**删光反而误导用户或在隐私合规上翻车**。

**禁止词对照（禁 ↔ 许）**：`Unlock iCloud Sync / 解锁 iCloud 同步 / iCloud Premium / Buy iCloud features / Access iCloud` ↔ `Cross-device sync / Cloud sync / Sync your data and settings across devices / 跨设备同步你的数据和设置`。

**坑（Why）**

- **Paywall 文案可能不在仓库**：先确认项目实际使用的 StoreKit、RevenueCat 或其他 Paywall 服务；若文案由服务端/后台配置，仓库内改动不会改变审核员看到的页面。判断"审核员看的是哪一份文案"优先于"改哪一行代码"。
- **别把披露语境的 iCloud 删干净**：那是必须如实说的机制（隐私政策、启用确认、账号状态）。4.10 拒的是"卖"，不是"提"。真实原则压过洁癖。
- **Pro 权益必须真实**：审核员会点对点核对"付费解锁了什么"。"持续更新"是承诺项可写，但别把没做的功能写进付费墙。
- **产物带着旧文案**：改 remotion 项目的文案/数据源（demo 项目中为 `copy.ts`/`shotData.ts`）后，已提交的 PNG/视频仍是旧文案——列进手动/重渲清单，别以为改完源就完了。
- **代码符号不改**：`privateICloud` / `.iCloudSync` entitlement / CloudKit 容器 ID 都是内部标识，面向开发不面向用户；entitlement id 是运营常量（如 `siflo_pro`），动了 IAP 直接出事。用户通常明确"不大范围重构代码"。

App Store 三技能互引：ASC 记录/Bundle 操作 → `erlin-asc`；截图物料/营销构图 → `erlin-app-store-marketing`；被拒整改/提审自查 → `erlin-app-store-compliance`。


# 输出格式

- 提审清单 + 禁/许表达对照表模板：见 `assets/review-compliance-checklist.md`。
- 整改交付 = 仓库内落地改动（xcstrings 精准 Edit、设置页权益列表、ASC 描述/caption/备注口径统一）+ 仓库外勾选式手动清单。
- 合规理由三段论（答复"为什么符合 4.10"用）：① 价值载体从系统能力移到 App 功能套餐；② 售卖语境零 iCloud（扫描清零）；③ App 内与商店/官网口径一致、权益全部真实。
- 翻译交付：字段名 + 字数 + 全文，结构与段落顺序和源文案一一对应，用户可直接复制进 ASC。
- 完整中→英对照成品案例：见 `references/store-copy-example.md`。

# 示例

## 用户问题

"我们的时钟 App 被 App Store 拒了，Guideline 4.10，说付费墙在卖 iCloud 同步。帮我整改，顺便把这次提审的商店文案翻成英文。"

## 工具返回

（本技能直接读仓库材料与用户输入，以实际输入材料代替工具返回）

### Localizable.xcstrings 过滤命中

```json
"pro.paywall.title": { "zh-Hans": "解锁 iCloud 同步", "en-US": "Unlock iCloud Sync" },
"paywall.feature.1": { "zh-Hans": "iCloud Premium", "en-US": "iCloud Premium" }
```

### 设置页 Pro 卡（grep `Text("...")` / `NSLocalizedString` 命中）

```swift
Text(NSLocalizedString("pro.paywall.title", comment: ""))
```

### docs/BRAND.md（存在时先读两节）

「App Store 文案框架」+「品牌红线」：语气安静、克制、器物感；全文禁 em-dash。

### ASC 源文案（用户给出，zh-Hans）

描述 + 关键词（含"iCloud 同步"品类词）+ 副标题 + 推广文本 + 新增内容。

## 最终输出

- 禁/许对照：`Unlock iCloud Sync` → `Cross-device sync`；`iCloud Premium` → `More premium features in future updates`。
- 仓库内：`pro.paywall.title` 值改为「跨设备同步你的数据和设置」，不再引用的键删除；Pro 卡换成 `✓` 权益列表（新键 `pro.benefit.*`：跨设备同步你的数据和设置 · 创建最多 99 个旅程 · 更多高级功能持续更新）；ASC 描述/caption/App Review 备注同步改口径。
- 扫描清零：禁用词 grep 结果为空；剩余 iCloud 引用（账号状态、启用确认、隐私政策）逐条理由留档。
- 仓库外手动清单：RevenueCat Paywall 文案、ASC IAP 商品名/描述、重渲截图/视频、Connect 填新描述并提审。
- en-US 翻译字段：描述（≤ 4000）、关键词（≤ 100，重排覆盖 desk clock / flip clock / nightstand clock 等实际搜索词）、副标题（≤ 30）、推广文本（≤ 170）、新增内容（≤ 4000），各带字数，无 em-dash。

# 门禁

- 扫描清零才可提审：全仓库（swift/ts/md，含测试）禁用词 grep 确认空；剩余 iCloud 技术性引用逐条理由留档。
- 订阅/终身 IAP 必须在 ASC 已进入"可供审核"状态（否则先撞 2.1(b)）。
- entitlement / bundle id / 收费逻辑一律不动；代码符号（`privateICloud`、`.iCloudSync` entitlement、CloudKit 容器 ID、entitlement id 如 `siflo_pro`）不改；不大范围重构代码。
- 披露语境（账号状态、错误/降级提示、启用确认、隐私政策）绝不删除；不可判定先保留并打标。
- Pro 权益必须真实存在；没做的功能不许写进付费墙。
- 源文案改了，已提交的 PNG/视频必须重渲、服务端/后台配置的 Paywall 文案必须同步改，否则不算完成。
- 翻译校验全过才可交付：字符限额（描述 ≤ 4000 / 关键词 ≤ 100 逗号分隔不重复含空格计字符 / 推广文本 ≤ 170 / 副标题 ≤ 30 / 新增内容 ≤ 4000）；关键词按目标市场习惯重排；禁止逐字翻译腔。
- 品牌红线：先读项目 `docs/BRAND.md`（或等价品牌文档）锁定红线；无则问用户或按项目语气自定。诚实条款通用——文案承诺的（"无账号、无收集、完全本地"）必须做到。具体红线示例（em-dash 禁令、卖点词禁用、商标词等）见 `references/store-copy-example.md`。
