# erlin-app-coding-standards

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

写、改、review Swift/SwiftUI 代码或做 Tuist/SPM 工程调整时使用——Apple 平台（Swift 6 / SwiftUI / Swift Testing / macOS/iOS）编码与工程规范：严格并发、SwiftUI 架构性能、Swift Testing、高风险文件保护。通用纪律叠加 erlin-dev-standards。

## When to reach for it

写、改、review Swift/SwiftUI 代码，处理并发/actor/@MainActor/Sendable，写单元测试（@Test #expect #require），搭 SwiftUI 视图结构，或做 Tuist/SPM 工程调整时使用；相关 Swift 开发任务即触发，无需点名本技能。

## Common questions

- **SwiftUI 性能纪律有哪些硬规则？**

  严格并发标注、避免 body 内重计算、大数据列表用 lazy 容器等，按项目版本取用。

- **需要每次全读吗？**

  不用：按任务风险查阅对应节，已加载的规范不重复读取。

## It's working if

- 代码审查意见落到平台硬规则上：严格并发标注、body 重计算、lazy 容器——每条有依据，不是泛泛"代码可以更优雅"。
- @Test 单测用 #expect/#require 风格写出，能在 Swift Testing 下直接跑绿。
- 与 erlin-dev-standards 叠加而不冲突：通用纪律一份、平台约束一份，各管各的。
