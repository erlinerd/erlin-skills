---
name: erlin-bdd
maturity: engineering
description: >-
  Behavior-driven testing for web and Apple: scenario specs in Markdown, Vitest + Playwright E2E on web, Swift Testing + XCUITest/Maestro on Apple. Use when the user asks for BDD or behavioral specs, or when a change crosses the threshold (3+ public interfaces, 3+ file modules, new screens, cross-screen flows, behavior needing product/design sign-off); plain unit tests follow erlin-dev-standards. BDD 测试规范（Web + Apple 双平台）：场景规格统一 Markdown（docs/bdd/*.md）；Web 用 Vitest 单元 + Playwright E2E；Apple 用 Swift Testing 单元 + XCUITest/Maestro E2E。用户要求 BDD/行为场景规格，或命中触发线（≥3 公共接口 / ≥3 文件模块改动 / 新页面 / 跨屏流程 / 行为需产品或设计确认）的测试安排时使用；日常单测按 erlin-dev-standards 验证门走，不触发本技能。
when_to_use: 用户要求 BDD/行为场景规格，或命中触发线（≥3 公共接口 / ≥3 文件模块改动 / 新页面 / 跨屏流程 / 行为需产品或设计确认）的测试安排时使用；日常单测按 erlin-dev-standards 验证门走，不触发本技能。
keywords:
  - BDD
  - 行为测试
  - 场景规格
  - Playwright
  - XCUITest
  - Maestro
  - cucumber
  - gherkin
  - Given/When/Then
  - 防回归
requires:
  - erlin-dev-standards
---

# 目标

BDD 测试规范（Web + Apple 双平台）：需求先变成可读的场景规格（统一 Markdown，`docs/bdd/*.md`），再拆单元层 + E2E 两层落地。双平台同构的心智模型：

```
Web:   特性需求 → 场景规格 Markdown（docs/bdd/*.md）
                     ├── 单元测试  Vitest        → 业务逻辑
                     └── E2E 测试  Playwright    → 真实浏览器

Apple: 特性需求 → 场景规格 Markdown（docs/bdd/*.md）
                     ├── 单元测试  Swift Testing → 业务逻辑
                     └── E2E 测试  XCUITest（深度集成）+ Maestro（冒烟/回归主力）
```

# 执行步骤

1. **拿到行为需求，先写成 Given/When/Then 场景句，再按下表落层**：

   | BDD 步骤 | 单元层 | E2E 层 |
   | --- | --- | --- |
   | Given（前置） | `beforeEach` 重建状态 / `context("当…时")` / 场景条目「- 假如 …」 | Web: `storageState` / API 注入；Apple: `launchArguments` 注入 / `runFlow` 子流程 |
   | When（动作） | 直接调函数/方法 | Web: `page.getByTestId(...)` 操作；Apple: `tapOn` / `.tap()` |
   | Then（预期） | `it("应该…") + expect` | Web: `await expect(...).toBeVisible()`；Apple: `assertVisible` / 断言 |

   规则：一条场景只测一个行为；三层连读必须是完整句子（读不了就重命名）；场景里的多个 Then 若分属不同模块，拆成多条场景分别落层。
2. **平台细则（按目标读对应文件，读完再动手）**：
   - 目标 Web（Markdown 场景规格 / Vitest / Playwright）：先读 `references/web.md`。
   - 目标 Apple（Markdown 场景规格 / Swift Testing / XCUITest / Maestro）：先读 `references/apple.md`。
3. **运行（命令速查）**：
   - Web 单元：`npx vitest run <file>`；E2E：`npx playwright test <file>`
   - Apple 单元：`swift test --filter <Spec>` 或 `xcodebuild test -only-testing:...`；E2E：`maestro test .maestro/`、`xcodebuild test -only-testing:...E2ETests`

# 判断规则

- **触发线：何时必须先出场景**——写实现之前先判断是否命中 BDD 门，命中任一就必须先产出 Given/When/Then 场景、确认后再写实现：
  - 新增或改动 ≥3 个公共接口；
  - 预估涉及 ≥3 个文件的模块级改动；
  - 包含新 UI 页面或跨屏用户流程；
  - 行为需要产品/设计确认的模块。

  未命中触发线的改动不强制出场景，按最窄验证门走单元测试。
- **新页面 UI 冒烟测试**：新用户可达页面默认一条可执行 UI 冒烟测试（Apple 用 XCUITest，Web 用 Playwright），锚定“进入 → 关键元素可见 → 主操作可达”三拍；页面坏了测试必须红。按风险与授权可豁免（脚本页、内部页、一次性页面）；与 `erlin-dev-standards` 冲突时以风险判断优先。真机 UI 测试环境不可用时，以模拟器或 Maestro 落地，不作为跳过理由。交互再多也先保这一条，其余行为按分层决策下推。
- **分层决策（写码之前先定层）**：

  | 行为特征 | Web 落点 | Apple 落点 |
  | --- | --- | --- |
  | 纯业务逻辑、规则计算、状态机 | Vitest | Swift Testing |
  | 规格/验收规格 | Markdown 场景（`docs/bdd/*.md`） | docs/bdd/*.md 场景（与 Web 同构） |
  | 跨页/跨屏用户旅程（onboarding、购买、登录） | Playwright | Maestro |
  | 系统级深度集成（权限、多上下文、多 app、系统弹窗） | Playwright（多 browser context / 权限 API） | XCUITest |
  | 判不准 | 先压到单元层，E2E 只留给失败代价最高的旅程 | 同左 |

- **E2E 数量克制（双平台同律）**：每个 E2E 的维护成本是单元测试的 10 倍量级，只覆盖钱、账号、onboarding 三类旅程；其余行为尽量下推到单元层验证。一条场景拆出的业务规则落 Vitest，旅程本身才落 Playwright，不在两层重复断言。
- **与其他规范的关系**：
  1. 通用工程纪律见 `erlin-dev-standards`（失败不静默、最窄验证门、检查点），本技能不重复。
  2. 平台编码规范：Apple 见 `erlin-app-coding-standards`，Web 前端另有各自约定。
  3. **单元框架分工（显式冲突，不折中）**：Web 侧单测统一 Vitest；Apple 侧单测统一 Swift Testing（`@Test` / `#expect`）。场景层级由 `docs/bdd/*.md` 承担（Web/Apple 同构），测试代码只写断言、不另建场景结构。同一测试 target 内不混用断言风格。

# 输出格式

- 场景规格统一 Markdown，落在 `docs/bdd/*.md`（Web/Apple 同构）。
- 场景写成 Given/When/Then 三层连读的完整句子；一条场景只测一个行为。
- 测试代码只写断言、不另建场景结构；同一测试 target 内不混用断言风格。

# 示例

## 用户问题

“新做一个登录页，另外有个订单金额的规则计算，测试怎么安排？”——登录页命中触发线（新 UI 页面/跨屏用户流程）。

## 工具返回

### npx vitest run（Web 单元）

金额规则计算落单元层：`beforeEach` 重建状态、直接调函数、`it("应该…") + expect`；输出该 spec 全部通过。

### npx playwright test（Web E2E）

登录旅程落 Playwright：`storageState`/API 注入前置、`page.getByTestId(...)` 操作、`await expect(...).toBeVisible()` 断言；失败时 `test-results/` 留有 trace 与截图。

## 最终输出

`docs/bdd/*.md` 场景规格 + 对应层测试落地：业务规则落 Vitest，登录旅程一条 Playwright E2E（新页面 UI 冒烟测试），全部跑绿。

# 门禁

- 命中触发线任一，就必须先产出 Given/When/Then 场景、确认后再写实现。
- 新页面 UI 冒烟测试：新用户可达页面默认一条可执行 UI 冒烟测试（可按风险与授权豁免，如脚本页、内部页、一次性页面）；页面坏了测试必须红；真机环境不可用以模拟器或 Maestro 落地，不作为跳过理由。
- 最窄验证门：改动只涉及单元层就只跑对应 spec；动了 E2E flow/场景或页面/视图结构才跑对应 E2E。
- 失败处理：E2E 挂了先看证据再改——Playwright 看 `test-results/` 的 trace 与截图，Maestro 看 `~/.maestro/tests/`，XCUITest 看 result bundle 附件；禁止不看证据直接重跑碰运气（重跑通过 ≠ 修好，见 `erlin-dev-standards` 排障律）。
- E2E 只覆盖钱、账号、onboarding 三类旅程，不在两层重复断言。
