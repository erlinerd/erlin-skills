---
name: erlin-meta
maturity: engineering
description: 轻量技能路由：维护仓库目录校验表与技能选择规则。用户问有哪些技能、该用哪个技能或任务主意图不明确时使用；先利用宿主技能描述，不要求每次开发都加载完整目录。
when_to_use: 需要技能选择、工程流或 App Store 子域分流时参考；先使用宿主描述，明确的小修无需读取完整目录。
keywords:
  - 哪些技能
  - 什么技能
  - 技能清单
  - 哪个技能
  - 该调哪个
  - 选择技能
  - Erlin 技能路由
  - App Store 发布路由
  - App Store 物料分流
  - 商店发布分流
  - available skills
  - list skills
  - 技能路由
  - 该用哪个技能
requires: []
---

# 目标

根据任务目标选择一个主技能，只追加必要的平台规范或专项能力。宿主名称和描述是首选目录，各技能 frontmatter 是触发与调用模式的权威源；无需重复阅读已加载的技能。下面的仓库表仅保留目录校验用途，不要求依次加载。

完整流程地图（主流程/汇入流/词汇层/独立件）见 [FLOW-MAP.md](FLOW-MAP.md)：用户问"整个流程怎么走""从想法到发布"或任务横跨多个阶段时读取；单点任务直接按表分发，不加载地图。

# 执行步骤

1. 根据目标与验收选择主技能；明确的小修直接执行，关键词匹配只生成候选。
2. 按风险查阅通用规范，Apple 任务按需补平台规范。已有授权持续有效，流程不另造审批点。
3. 只有上下文无法消除且影响结果的歧义才问用户。工程流各环节的通用做法（拷问计划、原型、拆票、diff 自查、复盘）见 FLOW-MAP.md，由模型直接执行，不依赖外部技能包。

## 高频入口

常驻路由入口（纯人工/agent 查阅的速查表；本表只含 erlin-* 技能，工程流各环节的通用做法见 FLOW-MAP）：

- 开发相关 → 按任务目标选择入口；目标和验收明确的小修可直接执行
- 工程规范 → 按风险查阅 `erlin-dev-standards`；Apple 平台约束按需查 `erlin-app-coding-standards`，已加载不重复
- 完成声明 → 报告实际验证与限制，不为收尾再次加载技能
- 架构评估 → `erlin-arch-review`；产品/UX/增长 → `erlin-product-review`
- 行为场景测试或命中触发线（大改动/新页面/跨屏/需产品确认）→ `erlin-bdd`；难定位 bug → `erlin-dev-standards` 排障条款；数值指标优化 → `erlin-auto-research`
- 做课/评课 → `erlin-course`
- Next.js/React 动效 → `erlin-web-motion`
- 不知道有哪些技能或拿不准入口 → `erlin-meta`

## Erlin 技能清单（仓库目录校验表）

技能按四桶存放：`skills/workflow/`（主流程与规范评审）、`skills/apple/`（上架链与平台规范）、`skills/web/`（Web 动效与物料）、`skills/garden/`（个人与沉淀）。下表分组与目录桶一一对应。

App Store 上架环节的技能分流见下方「App Store 子域分流」。

### workflow（主流程与规范评审）

| 技能 | 触发条件 |
| --- | --- |
| `erlin-dev-standards` | 通用工程规范：按风险查阅；已加载不重复；验证与授权边界 |
| `erlin-arch-review` | review、架构评估、"设计得怎么样"、重构建议、七原则审查 |
| `erlin-product-review` | 产品/UX/增长/商业四视角评估、上线前评估、复盘 |
| `erlin-bdd` | 写/改/运行行为测试；BDD 场景规格（docs/bdd/*.md）、XCUITest、Maestro |
| `erlin-auto-research` | 数值指标自动实验循环：无人值守优化可测量指标（耗时/构建体积/压缩率/分数），正确性门 + 噪声闸门 + 平台期熔断；"优化耗时/提速/减构建体积/跑实验循环/auto-research" |
| `erlin-safe-delete` | 用户资产与系统清理：列清单确认后移废纸篓；已授权代码删改、自建临时物按边界处理 |
| `erlin-meta` | 技能清单、触发规则、技能选择与 App Store 子域分流（本技能） |
| `erlin-autopilot` | 多任务并行编排（Inspect→切片→依赖图→选执行后端→逐张合并过门→brief）；按授权交付待审分支或集成结果，规范引用 erlin-dev-standards。**仅用户输入 /erlin-autopilot 触发，不自动调用** |

### apple（上架链与平台规范）

| 技能 | 触发条件 |
| --- | --- |
| `erlin-app-store-marketing` | App Store 截图物料全流程（Part A 提审规格截图：simctl 拍摄+OCR 核验；Part B 营销构图：卖点、设备框、品牌构图） |
| `erlin-app-coding-standards` | Swift 6 / SwiftUI / Swift Testing 项目，叠加在 dev-standards 之上 |
| `erlin-app-icon` | 设计/生成 App 图标、wordmark logo、上架图标；dev 构建角标图标与 Dev 显示名（原 erlin-app-dev-build 已并入） |
| `erlin-app-onboarding` | 重做/刷新引导页（onboarding、welcome、first-run） |
| `erlin-app-store-compliance` | App 被拒审整改（IAP/Guideline 4.10）、提审前自查，以及提审文案多语言化（默认 en-US，中译英） |
| `erlin-asc` | App Store Connect API CLI：创建/管理 ASC 的 App 记录、Bundle ID、多语言名称，查 App/Build，上架准备与 ASC 操作。**仅用户显式调用触发，不自动调用；写操作先确认** |

### web（Web 动效与物料）

| 技能 | 触发条件 |
| --- | --- |
| `erlin-web-motion` | Next.js/React 加动效、motion 库接入、framer-motion 迁移、滚动揭示 |
| `erlin-web-warm-terminal-design` | 暖色终端风推广页/官网设计（personOS 同款令牌+布局蓝图+话术公式） |
| `erlin-web-wechat-download` | 请求涉及微信/WeChat 与官网或 App Store 下载链接时处理兼容 |
| `erlin-social-assets` | 社交平台宣传图/视频（Instagram/X/小红书/YouTube 等规格）+ 局域网看图/物料预览服务；不含 App Store 营销构图 |

### garden（个人与沉淀）

| 技能 | 触发条件 |
| --- | --- |
| `erlin-skill-distill` | 把验证过的工作流提炼成 erlin-* 技能；"沉淀一下/做成 skill" |
| `erlin-course` | 课程制作（逆向设计：画像→Bloom 目标→评估先于正文→Gagné 骨架→正文→必过评审）与课程评审（三档判决+P0/P1/P2）；"做一门课/写课件/评课/课件验收/课件自审" |
| `erlin-profile` | 个人知识库（~/.me/）：录入/查询习惯、偏好、事实信息 |
| `erlin-obsidian-wiki` | Karpathy LLM Wiki 落地：用 obsidian CLI 在 vault 里增量编译/维护互链知识库（Ingest/Query/Lint）；"收进 wiki/查 wiki/整理 wiki/llm wiki" |
| `erlin-learning-plan` | 把项目/文档集安排成学习计划（首页源码地图+计划页+记录页+N 篇工作纸）；"怎么学这个项目/建学习专题" |
| `erlin-feishu-wiki` | 用 lark-cli 维护飞书知识库（markdown 覆盖上传+回查+CLI 踩坑+scope 授权）；"上传/回查飞书页面"。**仅用户显式调用触发，不自动调用；整篇覆盖需确认** |

## App Store 子域分流

按产物选最小集合：拒审整改、提审自查和商店文案 → `erlin-app-store-compliance`；截图 → `erlin-app-store-marketing`；请求涉及微信与官网下载链接 → `erlin-web-wechat-download`。App 内 UI 国际化不属于商店合规；官网浮层翻译按项目 i18n 约定处理。社交宣传图/视频 → `erlin-social-assets`。

# 输出格式

给出主技能、必要补充与手动边界即可，不复述全目录。

## 维护

「高频入口」为速查表。仓库表必须覆盖全部技能且行落在自己桶的小节，由 tests/skill-catalog.test.ts 校验。本技能只路由 erlin-* 技能，不维护外部技能目录。

新增技能才同步目录行与必要的计数断言。调用模式以已安装技能 frontmatter 为准。
