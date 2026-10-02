# Apple 平台细则（Markdown 场景规格 / Swift Testing / XCUITest / Maestro)

分层：规格层 = Markdown 场景文档（`docs/bdd/*.md`，与 Web 同构）；单元 = Swift Testing（业务逻辑）；E2E 主力 = Maestro；E2E 深度集成 = XCUITest。

## 1. Markdown 场景规格（规格层）

与 Web 完全同构：场景写在 `docs/bdd/<domain>.md`，每条场景用「- **假如/当/那么/并且**」条目书写，末尾标注执行层（Swift Testing 验证规则；Maestro/XCUITest 验证旅程）。

```markdown
# 场景规格：待办列表

## 功能：待办列表
作为用户，我希望管理待办，以便追踪要做的事。

## 场景

### 添加待办
- **假如** 列表为空
- **当** 我添加一条 "买牛奶"
- **那么** 列表应包含这 1 条待办

> 落层：数量上限等规则 → Swift Testing；添加旅程 → Maestro（新页面 UI 冒烟测试）。
```

## 2. Swift Testing（单元层 — 业务逻辑）

规则：

1. **统一 Swift Testing**（`@Test` / `#expect` / `#require`），同一 target 只用这一套断言风格。
2. **测试名 = "被测行为_应该_预期"** 的中文或英文完整句（如 `test_列表为空_应该显示空状态`），连读即文档；场景层级由 `docs/bdd/*.md` 承担，不靠测试框架复刻 describe/context/it。
3. **每个 `@Test` 前重建状态**：在测试函数内重新初始化 sut 与依赖；禁止用例间共享可变状态。
4. **IO 一律注入/mock**：仓储、网络、时钟从构造函数注入测试替身；异步收敛用 `confirmation` / `await`，禁止轮询 sleep。

```swift
import Testing
@testable import MyFeature

@Suite("TodoList")
struct TodoListTests {
    @Test("添加待办后应包含该条目")
    func addAppendsItem() {
        var sut = TodoList(repository: InMemoryRepository())
        sut.add("买牛奶")
        #expect(sut.items.count == 1)
    }

    @Test("数量达到 99 后应拒绝继续添加")
    func rejectAtLimit() {
        var sut = TodoList(repository: InMemoryRepository())
        sut.addN(99)
        #expect(throws: TodoList.Error.limitReached) { sut.add("买牛奶") }
    }
}
```

运行：`swift test --filter TodoListTests`

## 3. XCUITest（E2E — 深度集成场景）

**选用判据**（相对 Maestro）：需要系统权限弹窗/通知/剪切板、多 app 联动、`launchArguments` 复杂测试态注入、或 CI 上与 `xcodebuild test` 一体化时，用 XCUITest；其余 E2E 用 Maestro。

规则：

1. **只用 `accessibilityIdentifier` 查询元素**；不依赖本地化文本（换语言就挂）、不用坐标（换设备就挂）。
2. **状态注入走 `launchArguments` / `launchEnvironment`**，在 app 内读参数切测试数据源；禁止通过 UI 操作搭前置（慢且脆）。
3. **等待用 `waitForExistence(timeout:)`**，禁止 `sleep` / `Thread.sleep`。
4. `setUp` 里设 `continueAfterFailure = false`，一条断言失败立即停。

```swift
final class PurchaseE2ETests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func test_购买流程_成功后显示已完成() throws {
        let app = XCUIApplication()
        app.launchArguments += ["-uiTesting", "-resetState"]
        app.launch()

        app.buttons["purchase-button"].tap()
        app.buttons["confirm-button"].tap()

        XCTAssertTrue(app.staticTexts["purchase-done-label"].waitForExistence(timeout: 5))
    }
}
```

## 4. Maestro（E2E 主力）

1. **flow 放 `.maestro/` 目录**，命名 `journey-<流程>.yaml`（如 `journey-onboarding.yaml`）。
2. **断言与点击一律用 id**：`tapOn: { id: ... }`、`assertVisible: { id: ... }`；文本断言只用于最终结果文案。
3. **复用子流程用 `runFlow`**：登录等公共前置抽成 `subflow-*.yaml`，不复制粘贴步骤。
4. **参数化用 `env`**：appId、测试账号从环境变量读，不硬编码。

```yaml
# .maestro/journey-onboarding.yaml
appId: ${APP_ID}
name: 新用户完成 onboarding
tags:
  - smoke
---
- launchApp:
    clearState: true
- tapOn:
    id: onboarding-next-button
- tapOn:
    id: name-field        # 先聚焦输入框（Maestro 的 inputText 不按 id 点击聚焦）
- inputText: 测试用户
- tapOn:
    id: onboarding-done-button
- assertVisible:
    id: home-title
```

运行：

```bash
APP_ID=com.example.app maestro test .maestro/journey-onboarding.yaml   # 单条
APP_ID=com.example.app maestro test .maestro/                          # 全量（含 tags=smoke 的冒烟集）
```
