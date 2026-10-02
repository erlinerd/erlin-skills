---
name: erlin-autopilot
maturity: engineering
description: 多任务并行编排——Inspect→分类→Spec→垂直切片→依赖图→选执行后端（有编排器用编排器，否则原生 worktree 回退）→并行实现→逐张合并过门→brief。只拥有执行流程，不定义工程规范。仅由用户主动输入 /erlin-autopilot 触发（disable-model-invocation=true）。
when_to_use: 用户主动输入 /erlin-autopilot 编排一批可并行的任务——消息内任务列表、ticket 列表路径、或留空从仓库 issue tracker 拉取时使用；任务间足够独立、值得并行时适用。
disable-model-invocation: true
keywords:
  - /erlin-autopilot
argument-hint: "消息里的任务列表，或 ticket 列表路径，或留空从仓库 issue tracker 拉"
requires:
  - erlin-dev-standards
  - erlin-meta
---

# 目标

多任务并行编排：把一批任务编排成 Goal → Inspect → Classify → Spec（按需）→ 垂直切片 → 依赖图 → 选执行后端 → 并行实现 → 逐张合并过门 → brief 的完整执行流程。

**This skill owns execution workflow, not engineering policy.** 本技能只定义什么时候做什么、如何推进；仓库分支策略、分支命名、Spec 字段标准、编码规范、测试与完成定义、worktree 实现细节全部引用 `erlin-dev-standards`（Spec 契约：`erlin-dev-standards/references/spec-contract.md`；Git：`erlin-dev-standards/references/git.md`）。

规则冲突时优先级：**用户明确授权与要求 > 仓库指令（AGENTS.md / CLAUDE.md / CONTEXT.md）> erlin-dev-standards > 本技能默认**。

# 执行步骤

主流程：Goal → Inspect → Classify → Resolve uncertainty → Spec（按需）→ Prototype（按需）→ Slice → 依赖图 → **Select execution backend** → 建隔离执行环境 → Implement → Verify → Review → Integrate → Complete

0. **确定授权与交付点**：从当前请求和既有授权确定可修改范围，以及 commit、push、PR、合并、发布和清理的权限。默认可交付验证过的待审分支或工作区差异；只有明确授权集成时才合并。已有授权不重复询问；派发任务必须携带这些边界。
1. **Inspect**：读仓库事实，不按文件名猜架构：AGENTS.md、CLAUDE.md、CONTEXT.md、架构文档、ADR、package/工程配置、`git status`、既有测试、相关实现。
2. **Classify**：
   - **small**：局部修改、无新公共接口、影响面小 → 可不写正式 Spec（测试豁免线以 erlin-dev-standards 为准）。
   - **medium**：跨模块、新行为、新接口、新状态变化 → 必须 Spec（字段标准见 spec-contract）。
   - **large**：架构变化、migration、多个独立 vertical slice、并行价值明显 → Spec + 任务依赖图。
3. **Resolve uncertainty**：歧义在派发前解决——子代理跑到一半问不了人。用澄清/拷问能力（能力→技能映射查 `erlin-meta` 路由表）把模糊需求变成 agent-ready 任务：实现者照做不需问一个问题，含 blocking edges。跳过这步是第一大失败模式。外部进来的报告先分诊。
4. **Slice**：**垂直切片优先**：一个可观察行为 → 实现 → 持久化/集成 → 验证，一张票纵贯全层。禁止默认按 database / backend / frontend / tests 水平切层。触碰同一文件或同一模块缝的任务并进一张票或排串行。

   每个实现任务包含：Goal、Scope、Inputs、Outputs、Dependencies、Acceptance Criteria、Required Tests、Out of Scope、Branch、Base Branch。编号 `t1..tn` + 短 slug，按“先解除依赖”排序（能解锁别人的先合并）。
5. **Select execution backend**：

   ```text
   if 编排器被有意启用:
       先读其当前安装版本的编排技能指引，再按指引执行（不硬编码 CLI 参数）
       编排器负责：worktree 生命周期、agent session、并行执行、
       状态跟踪、任务依赖协调、（支持时的）review loop
   else:
       原生 worktree 回退——按 erlin-dev-standards 的 worktree 规则
       （references/git.md §1）开隔离环境，用子代理执行
   ```

   - **one worktree lifecycle owner**：编排器在管 worktree 时，原生回退不再插手同一个 worktree；反之亦然。
   - 编排器只是可选的高级执行后端，**不是本技能的运行时依赖**——没有它，整条流程必须完整可走。
6. **隔离执行环境 → Implement**：
   - 每个任务一个隔离上下文 + 一个子代理，并发上限 **3**（任务极小且追得过来才提高）。原生回退时用 `references/delegation-prompt.md` 模板派发，给 worktree **绝对路径**、Spec、验收标准。
   - 一任务一分支（按仓库分支策略命名，无策略时用 erlin-dev-standards 的 git.md 默认，base branch 按 erlin-dev-standards）；并行单元禁止共享 working tree。
   - 子代理内部纪律不降级：erlin-dev-standards 全条款照常（契约先行、测试、验证门）；按行为风险选择测试；明确要求 TDD 时走红绿循环，完成前对自身 diff 做 standards+spec 两轴 review 并修复所发现的问题。技能路由查 `erlin-meta`。
   - 主会话只编排，不做任务本身——主会话一忙，worktree 里的代理就漂了。
7. **Verify → Review → 按授权 Integrate**：
   - 待审交付点：验证并审查每个分支后保留分支/工作区，直接交付 brief；以下合并步骤仅在已获集成授权时执行。
   - 合并前每张票在**自己的隔离环境内**验证绿（验证顺序按 erlin-dev-standards：局部便宜 → 全局昂贵）。
   - 合并**逐张收、逐张过门**：merge 一张 → 门禁全绿 → 下一张；不攒批。合入 base branch 按仓库分支策略（仓库 policy 优先，无策略时用 erlin-dev-standards 的 git.md 默认），不默认写死 main。
   - 冲突按意图解，不靠挑行；按意图解不了 = 检查点（先走解决合并冲突的能力，再问一个决策就绪的问题）。
   - 全部合并后：base branch 全量门禁 + 对合并后总 diff 做一次 review（worktree 内已各自审过，这道门只抓集成问题）。
   - review 发现 actionable issue 先修复，再进入完成。
8. **Complete = 达成约定交付点 + Brief**：待审分支、未提交差异或已集成结果均可成为约定交付物。逐项报告状态、分支、commit hash（有则填）、改动、验证与限制。未获授权的合并或清理不算欠账；保留审阅所需 worktree，清理另按授权与清理门执行。

参考资料：

- `references/delegation-prompt.md` — 子代理提示词模板（原生回退派发用）
- `erlin-dev-standards/references/spec-contract.md` — Spec 契约字段标准
- `erlin-dev-standards/references/git.md` — worktree 规则、仓库分支策略、合并纪律

# 判断规则

- **触发条件**：仅由用户主动输入 `/erlin-autopilot`，带三者之一：消息正文里的任务列表；ticket/issue 列表的路径（来自拆票能力或 issue tracker）；什么都不带——从仓库的 issue tracker 拉 agent-ready 的 issue。
- **适用边界**：任务之间足够独立、值得并行时用。强耦合或需要一整段长对话的工作直接走单任务实现流程——并行有开销，不是免费的。
- **自治与检查点**：检查点能推多右推多右：大多数 run 从输入到 brief 之间零人工介入。只在以下情况浮出：决策真正属于用户（语义、产品决断、命名）；按意图解不了的冲突；集成红了且原因不明显。哪些动作可自动、哪些需授权（push/PR、发布、破坏性操作等）**以 erlin-dev-standards 安全条款为准**——隔离环境不是授权边界。
- **定时调度**：用户想让同一批任务按节奏重复（日报、每周扫一遍），用宿主环境的定时自动化机制（cron）注册同样的 `/erlin-autopilot <任务>` 提示词。erlin-autopilot 本身是一次性的——调度的是“调用”，不是“常驻进程”。
- **与相邻技能的关系**：产品层视角（做对了没、值得做吗）用 `erlin-product-review`——它从产品、UX、增长、商业四视角出评估卡。

# 输出格式

- 实现任务（票）：Goal、Scope、Inputs、Outputs、Dependencies、Acceptance Criteria、Required Tests、Out of Scope、Branch、Base Branch；编号 `t1..tn` + 短 slug，按“先解除依赖”排序。
- 最终交付 brief：每任务一行——状态、分支、commit hash、改了什么、测试结果，外加待决问题；审阅速度就是一切，从不贴原始输出。

# 示例

## 用户问题

“/erlin-autopilot 修支付重试 bug、给搜索加高亮、改设置页文案”——三个任务相互独立、值得并行；也可以只输入 `/erlin-autopilot` 留空，从仓库 issue tracker 拉 agent-ready 的 issue。

## 工具返回

### git status

Inspect 阶段读到的仓库事实：当前分支、工作区状态、既有测试与相关实现的位置。

### 子代理（每任务一个，隔离 worktree 内实现）

返回实现结果：改了什么、测试结果，以及完成前对自身 diff 做 review 发现并已修复的问题；照 Spec 执行，不需问一个问题。

## 最终输出

brief：每任务一行——状态、分支、commit hash、改了什么、测试结果，外加待决问题；已达到约定的待审或集成交付点，说明保留的分支与环境。

# 门禁

- 派发前歧义必须全部解决（Resolve uncertainty 不可跳过——跳过是第一大失败模式）。
- 禁止默认按 database / backend / frontend / tests 水平切层；触碰同一文件或同一模块缝的任务并进一张票或排串行。
- 并行单元禁止共享 working tree；并发上限默认 3。
- 合并逐张收、逐张过门，不攒批；冲突按意图解，不靠挑行。
- 主会话只编排，不做任务本身。
- 完成条件：达到已授权的交付点，相关验证与审查结果明确；允许待审分支，不为“完成”擅自 commit、合并、发布或清理。
- 授权边界以 erlin-dev-standards 安全条款为准——隔离环境不是授权边界。
