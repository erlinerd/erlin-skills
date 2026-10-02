# erlin-autopilot

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

多任务并行编排——Inspect→分类→Spec→垂直切片→依赖图→选执行后端（有编排器用编排器，否则原生 worktree 回退）→并行实现→逐张合并过门→brief。只拥有执行流程，不定义工程规范。仅由用户主动输入 /erlin-autopilot 触发（disable-model-invocation=true）。

## When to reach for it

用户主动输入 /erlin-autopilot 编排一批可并行的任务——消息内任务列表、ticket 列表路径、或留空从仓库 issue tracker 拉取时使用；任务间足够独立、值得并行时适用。

## Common questions

- **它和手动逐票 implement 的区别？**

  它自动切依赖图、并行推进、逐票合并过门；适合票间依赖清晰的批量任务。

- **跑完产出什么？**

  待审分支或集成结果 + brief，最终合并决定权在人。

## It's working if

- 任务被切成依赖图：哪些能并行、哪些有阻塞边，一图看清。
- 每张票合并前都过了同样的验证门，不攒批、不降级。
- 结束时拿到 brief + 待审分支（或集成结果），最终合并由人拍板。
