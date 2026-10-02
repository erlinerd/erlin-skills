---
name: erlin-app-coding-standards
description: 写、改、review Swift/SwiftUI 代码或做 Tuist/SPM 工程调整时使用——Apple 平台（Swift 6 / SwiftUI / Swift Testing / macOS/iOS）编码与工程规范：严格并发、SwiftUI 架构性能、Swift Testing、高风险文件保护。通用纪律叠加 erlin-dev-standards。
when_to_use: 写、改、review Swift/SwiftUI 代码，处理并发/actor/@MainActor/Sendable，写单元测试（@Test #expect #require），搭 SwiftUI 视图结构，或做 Tuist/SPM 工程调整时使用；相关 Swift 开发任务即触发，无需点名本技能。
keywords:
  - swift
  - '@test'
  - '#expect'
  - '#require'
  - xcode
  - tuist
  - spm
  - actor
  - sendable
  - ios
  - macos
  - watchos
  - visionos
requires:
  - erlin-dev-standards
---

# 目标

适用于 Swift / SwiftUI / Swift Testing / macOS / iOS 的编码约束与工程纪律。**本规范按当前 Swift 工具链、部署版本与项目架构适用**：写新代码、改旧代码、review 都按此执行。

# 执行步骤

写代码 / 改代码 / review 时按以下顺序执行：

1. **前置：通用工程纪律**。通用规范（先读再写、最小切口、证据闭环、最窄验证门、假设-溯因排障、检查点）见 `erlin-dev-standards`，本技能不重复。下面只写 Apple 平台特有的部分，以及通用规则在 Apple 工具链上的具体落点（见「判断规则」）。
2. **Swift 6 严格并发（Concurrency）**：
   1. **默认不可变**：跨隔离域传递数据优先考虑值类型与不可变属性；`struct` + `let` 不自动保证 `Sendable`，成员必须满足可发送条件，泛型约束、显式/隐式一致性与隔离规则以当前 Swift 版本和编译器检查为准。
   2. **明确 Actor 边界**：UI 状态绑定 `@MainActor`；共享可变状态封装为独立 `actor`。
   3. **严禁滥用 `@unchecked Sendable`**：仅在内部有完整底层锁保护（如 `OSAllocatedUnfairLock`）且能给出佐证时使用。
   4. **非隔离闭包穿透检查**：异步闭包避免隐式捕获外部 `var`，改用 `let snapshot` 快照捕获跨隔离域传递。
3. **Swift Testing（现代测试规范）**：
   1. **按测试层与工具链选择**：兼容的单元/集成测试优先 Swift Testing（`@Test`）；UI 自动化使用 XCTest/XCUITest（`XCUIApplication` 等）。已有 XCTest 套件可继续维护，不因本规范强制迁移。
   2. **断言分级**：常规验证用 `#expect(...)`；前置条件失败需终止用例时用 `#require(...)`。
   3. **参数化测试**：用 `@Test(arguments: [...])` 代替手写 `for` 循环；确保用例独立、无副作用。
   4. **无共享单例状态**：每个用例独立初始化依赖，保证并行执行无竞态。
4. **SwiftUI 架构与性能**：
   1. **Observation 适配**：部署版本支持且符合项目架构时可选 `@Observable`；低版本兼容或现有 `ObservableObject` 架构继续沿用，不为局部任务强迁移。
   2. **防止过度重绘**：`body` 内不做复杂运算；闭包内不捕获大对象。
   3. **轻量 View 分解**：把复杂视图拆为遵循不可变原则的 Subviews，便于编译器优化布局树。
5. **工程解耦与模块化（Tuist / SPM）**：
   1. **沿用工程来源**：使用已有 Tuist、XcodeGen、SPM 或原生 Xcode 工程；不为局部修改引入 Tuist。生成型工程改源配置，原生工程可做最小可逆的 `project.pbxproj` 修改。
   2. **按真实边界模块化**：仅在复用、编译或依赖隔离收益明确时拆 Package / Framework，不机械拆分已有 Target。
   3. **工程结构同步**：Target 或依赖变化后用项目既有生成/解析方式同步；原生工程验证配置和引用。

# 判断规则

- **适用边界**：所有 Swift 相关任务（写、改、review、并发/actor/@MainActor/Sendable、单测、SwiftUI 视图、Tuist/SPM 工程调整）即触发本规范；非 Swift 项目的规则（Node、Python、前端）不在此列，另见各自约定。
- **与相邻技能的关系**：通用工程纪律在 `erlin-dev-standards`，本技能只写 Apple 特有部分，不重复通用规范。
- **验证强度分支（最窄验证门的 Apple 落点）**：日常小改 = 对应 Module 的 Development Scheme Build 成功（Exit Code 0）+ 定向单测；高风险（持久化迁移、public API、构建配置）才升级到集成测试与全量构建。
- **调试上下文（保留调试上下文的 Apple 落点）**：保持活动 Scheme 与已启动的 Simulator，不随意重启模拟器或重置沙盒——重建比这次验证本身更贵。
- **测试**：兼容的单元/集成测试优先 Swift Testing；已有 XCTest 套件可继续维护，不强制迁移；UI 自动化用 XCTest/XCUITest（与执行步骤 3.1 口径一致）。

# 输出格式

（本技能无此环节）

# 示例

## 用户问题

"给订阅模块写单元测试；另外这个共享可变状态我想用 `@unchecked Sendable` 直接标一下就行，能过吗？"

## 工具返回

本技能无外部工具。实际输入材料 = 拟合入规范的代码现状：

- 共享可变状态拟用 `@unchecked Sendable` 标注（无底层锁佐证）
- 测试沿用 XCTestCase 类继承 + 手写 `for` 循环参数化
- ViewModel 状态用 `@ObservedObject` / `ObservableObject`
- 单体大 Target，工程结构手改 `project.pbxproj`

## 最终输出

- 并发：跨隔离域改 `struct` + `let`，共享可变状态封装 `actor`，UI 状态绑定 `@MainActor`，跨隔离闭包用 `let snapshot` 捕获；拒绝无佐证的 `@unchecked Sendable`。
- 测试：`@Test` 宏 + 轻量结构体，断言分级 `#expect`/`#require`，`@Test(arguments:)` 参数化，用例独立无共享单例状态。
- SwiftUI：按部署版本与现有状态模型选择 Observation；不因规范强迁移。
- 工程：沿用已有工程管理方式，按任务必要性调整模块边界并验证。
- 验证：按最窄验证门执行——Development Scheme Build 成功（Exit Code 0）+ 定向单测。

# 门禁

**高风险文件检查**——修改下列文件前检查实际影响并采用最小可逆方案；已在用户授权范围内的工程修改直接执行，不反复确认。新增权限、分发身份变化或实际执行不可逆数据迁移超出授权时才询问：

- 依赖锁文件：`Package.resolved`、`Podfile.lock`、`Cartfile.resolved`
- Xcode 主配置：`*.xcodeproj/project.pbxproj`
- 签名与分发：`*.entitlements`、`ExportOptions.plist`、Provisioning Profile
- 数据库迁移与数据持久化定义文件
