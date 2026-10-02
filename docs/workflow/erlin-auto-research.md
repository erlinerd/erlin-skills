# erlin-auto-research

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

数值指标自动实验循环——把"优化一个可复现的数字"变成无人值守试错循环（基线定噪声闸门 → 每轮一假设一改动 → 变好保留/否则回滚，产出 EXPERIMENTS.md 台账）。当用户说"auto-research""优化耗时/性能""压测提速""减构建体积""降 bundle size""自动试错""跑实验循环"并接受自主多轮改代码时使用——即使没提 skill 名；也用于给 Goal 模式配长跑优化任务。

## When to reach for it

优化可数值化、可反复测量的指标（耗时/体积/压缩率/分数），或在 Goal 模式、Automations 里挂自主优化长任务时使用；用户点名 auto-research 即触发。不适用于无数字判据的工作——新功能、UI 设计、正确性重构（“好不好”要人判，循环无法裁决）；这类转 erlin-autopilot。与 erlin-dev-standards 的关系：那个管“怎么写对”，本技能管“怎么自动试错不跑偏”——证据闭环、失败不静默在循环里逐轮执行。

## Common questions

- **适合优化什么指标？**

  耗时、构建体积、压缩率、分数——任何可自动测量且基线可复现的数字。

- **怎么防止越优化越坏？**

  正确性门 + 噪声闸门（基线方差内不算提升）+ 平台期熔断，三轮无改善自动停。

## It's working if

- 产出 EXPERIMENTS.md 台账：每轮一个假设、一次改动、一组测量数字，试错过程可回溯。
- 每个被保留的改动都附"变好"的数字证据，且提升量超出基线噪声；不达标的改动已回滚。
- 连续三轮无改善时循环自动停止并汇报，而不是无限跑下去。
