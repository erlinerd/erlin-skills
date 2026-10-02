# erlin-skills 工程流（erlin-meta 视角）

> 本文是**流地图**：把仓库 27 个技能组织成"主流程 + 汇入流 + 独立件"，让"从想法到发布"的每一步都有明确入口。
> 布局：技能按四桶存放（workflow/apple/web/garden，退役进 `_attic`）；桶是目录分组，本图是流程分组，两轴互补。
> 触发与调用模式的权威源始终是各 SKILL.md 的 frontmatter；冲突时 frontmatter 赢。
> mattpocock/skills 的对应物是 `ask-matt`（user-invoked）；本文件由 `erlin-meta` 承载（model-invoked，hook 注入），
> 不新增技能、不新增斜杠命令。

## 主流程：想法 → 上架/发布

1. **锤想法**：目标或验收模糊 → `grilling`（拷问计划）；在仓库内工作且要留档（GLOSSARY.md/ADR）→ 建议用户跑 `/grill-with-docs`（手动）。
2. **分支：问题要靠“跑起来”才能回答？**（状态模型、UI 手感）→ `prototype` 出一次性原型回答（跨目录/跨 harness 时建议用户用 `/handoff` 桥接），结论带回主流程。
3. **规模分支：多会话/多任务？**
   - 是 → 建议用户跑 `/to-spec` → `/to-tickets`（拆成带阻塞边的票）；讨论阶段保持同一上下文窗口，拆完票再切。然后：
     - 逐票做（每票新开上下文，票要写到可独立完成）：`erlin-dev-standards` 纪律 + `tdd` 红绿循环，每票完成后 `code-review`。
     - 整包并行：建议用户跑 `/implement-spec`（worktree 并行 + integration branch）。
   - 否 → 直接实现：写/改代码全程 `erlin-dev-standards`；Swift/SwiftUI 叠加 `erlin-app-coding-standards`。
4. **测试策略分支**：命中触发线（≥3 公共接口 / ≥3 文件模块 / 新页面 / 跨屏流程）→ `erlin-bdd`；单行为测试先行 → `tdd`。
5. **收尾**：完成后 `code-review`（diff 两轴）；上 PR → `pr` 写 body。要并行推进多票 → 建议用户跑 `/erlin-autopilot`（user-triggered only）。
6. **复盘**：建议用户跑 `/retro`（手动）：改环境不改代码——机械错误变确定性检查，判断错误变 coding standards。每个 build 之后都适用，跑砸了的尤其要。

## 汇入流

- **坏了一个**（难定位 bug、间歇、性能回归）→ `diagnosing-bugs`；根因若是“没有好缝可锁死 bug”→ 接 `erlin-arch-review`；复盘统一走主流程第 6 步。
- **外来请求堆积**（bug 报告/功能请求）→ 建议用户跑 `/triage`；`/to-tickets` 产的票是 agent-ready 的，不再 triage。
- **雾太大**（新项目/大特性，一个会话装不下）→ 建议用户跑 `/wayfinder`；出图后并回主流程 `/to-spec`。
- **发布前把关**：产品视角 → `erlin-product-review`；架构视角 → `erlin-arch-review`；课程 → `erlin-course-review`。
- **Apple 上架子域**：见 erlin-meta「App Store 子域分流」——物料链（`erlin-app-icon`→`erlin-app-dev-build`→`erlin-app-onboarding`→`erlin-app-store-marketing`→`erlin-app-store-compliance`→`erlin-asc`）按产物取最小集合；微信下载兼容走 `erlin-web-wechat-download`。

- **闲时健康**（非功能工作）：建议用户跑 `/improve-codebase-architecture` 扫深化机会，选中的一个作为想法回主流程第 1 步；选中后的设计用 `codebase-design` 词汇层。

## 词汇层（被上层技能拉入，也可直达）

- `codebase-design`：模块形状词汇（模块/接口/深度/缝）；`tdd`、`erlin-arch-review` 都用它。
- `domain-modeling`：领域语言锤炼（GLOSSARY.md/ADR）；grilling 系列内部使用。
- `erlin-dev-standards`：通用纪律，写码全程在线。
- `write-swift`：Swift 深水区语言技法；日常规范用 `erlin-app-coding-standards`。

## 独立件

- **做课** → `erlin-course-create`（写之前）→ `erlin-course-review`（写完之后）。
- **学习项目** → `erlin-learning-plan`；**沉淀工作流** → `erlin-skill-distill`；**知识库** → `erlin-obsidian-wiki`。
- **个人偏好** → `erlin-profile`；**删除纪律** → `erlin-safe-delete`。
- **数值优化** → `erlin-auto-research`：无人值守实验循环优化可测量指标，并入汇入流“发布前把关”。
- **物料与 Web** → `erlin-social-assets`、`erlin-web-lan-preview`、`erlin-web-motion`、`erlin-web-warm-terminal-design`。
- **外部独立件**（matt 流，手动或拉入）：`research`（后台调研，产物喂给第 1 步）、`wizard`（只有人能做的步骤）、`to-questionnaire`（阻塞在别人那）、`wait-what`（没听懂重讲）、`handoff`（跨 harness/目录交接）。

## 阶段边界

阶段切换点（锤完想法、拆完票、实现完）先决定上下文怎么办：默认 continue 接着走；下一阶段用不到当前内容 → clear；换目录/换 harness/换人 → 建议用户跑 `/handoff`；可独立的大块工作 → 子代理；窗口逼近极限 → 在阶段边界 compact，不在阶段中间硬撑。

## 手动边界（建议用户跑命令，不自动调用）

`ask-matt`、`grill-with-docs`、`to-spec`/`to-tickets`/`implement`/`implement-spec`、`triage`、`wayfinder`、`improve-codebase-architecture`、`retro`、`handoff`、`teach`、`wait-what`、`to-questionnaire`、`review-animations`、`erlin-autopilot`、`erlin-asc`、`erlin-feishu-wiki`。
