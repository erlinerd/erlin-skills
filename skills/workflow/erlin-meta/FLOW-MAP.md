# erlin-skills 工程流（erlin-meta 视角）

> 本文是**流地图**：把仓库全部技能组织成"主流程 + 汇入流 + 独立件"，让"从想法到发布"的每一步都有明确入口。
> 布局：技能按四桶存放（workflow/apple/web/garden，退役进 `_attic`）；桶是目录分组，本图是流程分组，两轴互补。
> 触发与调用模式的权威源始终是各 SKILL.md 的 frontmatter；冲突时 frontmatter 赢。
> 本图**自包含**：每一步的落点都是 erlin-* 技能或由模型直接执行的等效动作，不依赖 erlin-skills 之外的技能包（宿主的通用能力——子代理派发、浏览器/终端工具——不在"技能包"之列）。
> 本文件由 `erlin-meta` 承载（model-invoked），不新增技能、不新增斜杠命令。

## 主流程：想法 → 上架/发布

1. **锤想法**：目标或验收模糊 → 模型直接拷问计划（列出假设、开放问题、验收边界，逐项让用户确认）；确认结果留档到 GLOSSARY.md / docs/adr/。业务事实不足时区分 confirmed / inferred / proposed，未决问题显式列出，不当默认规则实现。
2. **分支：问题要靠"跑起来"才能回答？**（状态模型、UI 手感）→ 写一次性原型回答一个具体设计问题，结论带回主流程，原型不进主干。
3. **规模分支：多会话/多任务？**
   - 是 → 先把讨论收敛成任务级 Spec（字段标准见 `erlin-dev-standards/references/spec-contract.md`），再拆成带阻塞边的票。然后：
     - 逐票做（每票新开上下文，票要写到可独立完成）：`erlin-dev-standards` 纪律 + 测试先行，每票完成后对自身 diff 做 standards+spec 两轴自查。
     - 整包并行：`/erlin-autopilot`（user-triggered only，worktree 并行 + 逐张合并过门）。
   - 否 → 直接实现：写/改代码全程 `erlin-dev-standards`；Swift/SwiftUI 叠加 `erlin-app-coding-standards`。
4. **测试策略分支**：命中触发线（≥3 公共接口 / ≥3 文件模块 / 新页面 / 跨屏流程 / 行为需产品或设计确认）→ `erlin-bdd`；未命中 → 按 `erlin-dev-standards` 的风险验证门走单元测试。
5. **收尾**：完成后 diff 自查（standards 轴：守了工程约定吗；spec 轴：实现了规格吗）；`erlin-arch-review` 做架构级复审（跨模块或大改动时）。写 PR body：最小可视化摘要 + before/after 证据 + 合并风险判断。要并行推进多票 → 建议用户跑 `/erlin-autopilot`。
6. **复盘**：改环境不改代码——机械错误变确定性检查（测试/脚本/契约），判断错误变 coding standards 条款回填 `erlin-dev-standards` 或项目规范。每个 build 之后都适用，跑砸了的尤其要。

## 汇入流

- **坏了一个**（难定位 bug、间歇、性能回归）→ 按 `erlin-dev-standards` 排障条款走「假设→最小复现→确认→修复+防回归」反馈回路；根因若是"没有好缝可锁死 bug"→ 接 `erlin-arch-review`；复盘统一走主流程第 6 步。
- **数值指标可测**（耗时/构建体积/压缩率/分数）→ `erlin-auto-research` 无人值守实验循环。
- **外来请求堆积**（bug 报告/功能请求）→ 先分诊再拆票：复现步骤、影响面、期望行为三要素齐了才进主流程。
- **雾太大**（新项目/大特性，一个会话装不下）→ 先出决策工单地图：列出关键未知项与决策顺序，每个决策一张票，再回主流程第 3 步。
- **发布前把关**：产品视角 → `erlin-product-review`；架构视角 → `erlin-arch-review`；课程 → `erlin-course`（评审模式）。
- **Apple 上架子域**：见 erlin-meta「App Store 子域分流」——物料链（`erlin-app-icon`（含 dev 角标）→`erlin-app-onboarding`→`erlin-app-store-marketing`→`erlin-app-store-compliance`→`erlin-asc`）按产物取最小集合；微信下载兼容走 `erlin-web-wechat-download`。

## 词汇层（被上层技能拉入，也可直达）

- `erlin-dev-standards`：通用纪律，写码全程在线；模块形状词汇（深模块/接口/缝）见其 references。
- `erlin-app-coding-standards`：Apple 平台约束，Swift/SwiftUI 项目叠加。

## 独立件

- **做课/评课** → `erlin-course`（制作模式：写之前+写的时候；评审模式：写完之后）。
- **学习项目** → `erlin-learning-plan`；**沉淀工作流** → `erlin-skill-distill`；**知识库** → `erlin-obsidian-wiki`。
- **个人偏好** → `erlin-profile`；**删除纪律** → `erlin-safe-delete`。
- **物料与 Web** → `erlin-social-assets`（含局域网预览）、`erlin-web-motion`、`erlin-web-warm-terminal-design`。
- **调研**（后台按一手资料调研，产物喂给主流程第 1 步）、**只有人能做的步骤**（开凭据/配 secrets：生成交互式脚本给用户跑）、**阻塞在别人那**（生成问卷让对方填）——均由模型按任务直接执行，无专属技能。

## 阶段边界

阶段切换点（锤完想法、拆完票、实现完）先决定上下文怎么办：默认 continue 接着走；下一阶段用不到当前内容 → clear；换目录/换 harness/换人 → 写可移植交接文档（做了什么/为什么/下一步/未决项）；可独立的大块工作 → 子代理；窗口逼近极限 → 在阶段边界 compact，不在阶段中间硬撑。

## 手动边界（仅用户显式触发，不自动调用）

`erlin-autopilot`、`erlin-asc`、`erlin-feishu-wiki`。
