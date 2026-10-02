# Web 平台细则（Markdown 场景规格 / Vitest / Playwright）

分层：规格层 = Markdown 场景文档（`docs/bdd/*.md`）；单元 = Vitest（业务逻辑）；E2E = Playwright（真实浏览器）。

```
特性需求 → 场景规格 Markdown（docs/bdd/*.md）
              ├── 单元测试  Vitest      → 业务逻辑
              └── E2E 测试  Playwright  → 真实浏览器
```

核心关系：`docs/bdd/*.md` 是唯一规格源，每条场景标注自己的执行层。一条场景拆两层——场景背后的业务规则落 Vitest；端到端旅程落 Playwright。两层不重复断言。

## 1. Markdown 场景规格（规格层）

### 目录与格式约定

```
docs/bdd/
  <domain>.md               # 场景规格（活文档），与对应测试同步维护
```

每份文件的结构：功能叙述（作为…我希望…以便…）→ 场景列表。每条场景用「- **假如/当/那么/并且**」条目书写，末尾标注执行层。

### 场景文件规则

1. 场景标题 = 行为本身（"添加商品到购物车"），不写实现细节。
2. 假如/当/那么 三行连读必须是完整句子（同 Apple 侧 describe/context/it 律）。
3. 一步一动作；数据写在场景句里，不在文件外另附数据表。
4. 每份规格文件头部标注落层：哪些规则由 Vitest 验证、哪些旅程由 Playwright 验证。

```markdown
# 场景规格：购物车

## 功能：购物车
作为购物者，我希望管理购物车中的商品，以便结算。

## 场景

### 添加商品到购物车
- **假如** 用户已登录
- **当** 用户将 "买牛奶" 加入购物车
- **那么** 购物车应包含 1 件商品

> 落层：数量上限等规则 → Vitest；加购旅程 → Playwright（新页面默认一条 UI 冒烟测试，按风险可豁免）。
```

## 2. Vitest（单元层 — 业务逻辑）

规则：

1. **describe = 被测系统**（名词）、**it = "应该…"**，连读成句。
2. **每个 it 前重建状态**：`beforeEach` 重新初始化；禁止用例间共享可变状态（Vitest 并行跑文件）。
3. **IO 一律 mock**：`vi.mock(...)` 隔离网络/存储/时间；异步收敛用 `await vi.waitFor(...)`，禁止轮询 sleep。
4. **场景规格（docs/bdd/*.md）拆出的业务规则在这里验证**——例如"购物车数量上限 99"是 Vitest 的事，不在浏览器里点 100 次。

```ts
// tests/cart.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { Cart } from '../src/cart'

describe('Cart', () => {
  let cart: Cart

  beforeEach(() => {
    cart = new Cart()
  })

  it('添加商品后应包含该条目', () => {
    cart.add('买牛奶')
    expect(cart.items).toHaveLength(1)
  })

  it('数量达到 99 后应拒绝继续添加', () => {
    cart.addN(99)
    expect(() => cart.add('买牛奶')).toThrow(/上限/)
  })
})
```

运行：`npx vitest run tests/cart.spec.ts`

## 3. Playwright（E2E 层 — 真实浏览器）

规则：

1. **定位只用 `getByTestId` / `getByRole`**；禁止 CSS 选择器、XPath、硬编码文本（换语言就挂、换结构就挂）。
2. **前置状态走注入，不走 UI**：登录态用 `storageState`，数据用 API/route 拦截造；禁止每个用例先跑一遍登录流程（慢且脆）。
3. **断言用 `await expect(locator).toBeVisible()` 等自动等待断言**，禁止 `waitForTimeout`。
4. **`webServer` 托管 dev server**（`reuseExistingServer: !process.env.CI`），用例不假设端口存活。
5. **失败证据默认开**：`trace: 'on-first-retry'`、`screenshot: 'only-on-failure'`，产物在 `test-results/`。

```ts
// e2e/onboarding.spec.ts
import { test, expect } from '@playwright/test'

test('新用户完成 onboarding', async ({ page }) => {
  await page.goto('/onboarding')

  await page.getByTestId('onboarding-next').click()
  await page.getByTestId('name-field').fill('测试用户')
  await page.getByTestId('onboarding-done').click()

  await expect(page.getByTestId('home-title')).toBeVisible()
})
```

```ts
// playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

运行：`npx playwright test e2e/onboarding.spec.ts`
