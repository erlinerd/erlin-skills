# erlin-bdd

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

BDD 测试规范（Web + Apple 双平台）：场景规格统一 Markdown（docs/bdd/*.md）；Web 用 Vitest 单元 + Playwright E2E；Apple 用 Swift Testing 单元 + XCUITest/Maestro E2E。用户要求 BDD/行为场景规格，或命中触发线（≥3 公共接口 / ≥3 文件模块改动 / 新页面 / 跨屏流程）的测试安排时使用；日常单测不触发。

## When to reach for it

用户要求 BDD/行为场景规格，或命中触发线（≥3 公共接口 / ≥3 文件模块改动 / 新页面 / 跨屏流程）的测试安排时使用；日常单测不触发。

## Common questions

- **什么时候从 tdd 升级到 BDD？**

  命中触发线：≥3 个公共接口、≥3 文件的模块改动、新页面、跨屏流程。

- **Apple 和 Web 的产物分别是什么？**

  Web：docs/bdd/*.md 场景规格 + Vitest 单测 + Playwright E2E；Apple：Swift Testing 单测 + XCUITest/Maestro E2E。

## It's working if

- 场景规格落在 docs/bdd/ 下的 Markdown 里，每个场景可独立对照实现验证。
- 测试分层与平台匹配：Web 跑 Vitest 单测 + Playwright E2E，Apple 跑 Swift Testing + XCUITest/Maestro，全部可重复执行。
- 触发线判断透明：为什么这单要做 BDD（接口数/文件数/新页面/跨屏）说得出来。
