# 审核合规整改 Checklist（模板）

> 复制到目标项目使用。勾完整份 → 仓库内清零 + 仓库外手动项全过 → 再提审。
> 适用于"付费墙在卖系统能力"（Guideline 4.10）类拒因；其它拒因不复用。

## A. 售卖面盘点（六处，逐处勾）

- [ ] App 本地化字符串（`Localizable.xcstrings` / `*.strings`）——已抽键值过滤 sync/iCloud/Pro/同步/订阅/解锁
- [ ] SwiftUI 文案（设置页 Pro 卡、同步入口行、Onboarding、订阅状态页）
- [ ] 官方 Paywall（按实际项目填写配置端；服务端/后台配置的仓库改它无效。示例：RevenueCat Dashboard、ASC 内购配置、自建 StoreKit Paywall）
- [ ] App Store Connect：描述 / 截图 caption / 促销文本 / **IAP 商品名与描述** / App Review 备注
- [ ] 营销素材（按实际项目填写文案数据源。示例：remotion 工程的 `copy.ts` / `shotData.ts`）、社媒文案、官网（privacy 页披露保留）
- [ ] 已提交的渲染产物（`screenshots/*.png`、视频）——文案源改了要重渲

## B. 售卖 vs 披露 分类

| 提及 | 判定 | 处理 |
|---|---|---|
| Unlock iCloud Sync / 解锁 iCloud 同步 / iCloud Premium / Buy iCloud features / Access iCloud / "Pro unlocks iCloud…" | 售卖 | 删除，替换为 App 功能卖点 |
| 跨设备同步 / Cloud sync / Sync your data and settings across devices | 允许 | 保留为新口径 |
| 账号状态（已登录 iCloud / iCloud 访问受限） | 披露 | **保留** |
| 错误/降级提示（无法连接 iCloud） | 披露 | **保留** |
| 启用确认（数据会上传到你的私人 iCloud…） | 披露 | **保留** |
| 隐私政策里的同步描述 | 披露（合规必须） | **保留** |

## C. Pro 重定位（权益必须真实、可核对）

- [ ] Pro 标题：`Pro / Unlock the complete experience`（中：Pro / 解锁完整体验）
- [ ] 权益 2-3 条（可参考）：跨设备同步你的数据和设置 / 创建最多 99 个旅程 / 更多高级功能持续更新
- [ ] 没有把未实现的功能写进付费墙

## D. 仓库内落地

- [ ] 本地化键精准 Edit（匹配唯一 value），不再引用的键删除
- [ ] 设置页卖点行 → 权益列表（✓ 行 + 新键）
- [ ] App Store 描述 / 截图 caption / App Review 备注模板 / 产品定位文档同步口径
- [ ] 测试断言检查（通常断言内部枚举，确认是否要跟改）

## E. 禁用词扫描清零 + 理由留档

- [ ] `grep -rniE "unlock iCloud|解锁 iCloud|iCloud Premium|buy iCloud|access iCloud|Pro unlocks iCloud"` 全仓库为空
- [ ] 剩余技术性 iCloud 引用逐条写了保留理由

## F. 仓库外手动清单（交用户勾）

- [ ] Paywall 配置端（示例：RevenueCat Dashboard）：Paywall 标题/权益/无 iCloud 卖点
- [ ] ASC：IAP 商品显示名/描述中性（不带 iCloud）
- [ ] 重渲截图/视频（按实际项目填写渲染管线。示例：remotion 工程改 `copy.ts`/`shotData.ts` 后跑 render）
- [ ] ASC 版本页填入新描述/截图 caption 并提交审核
- [ ] IAP 在 ASC 处于"可供审核"状态（防 2.1(b)）
- [ ] entitlement / bundle id / 收费逻辑未动

## 合规理由三段论（答复"为什么符合"）

1. 价值载体从系统能力移到 App 功能套餐（Pro = 多权益组合，不是买 iCloud）。
2. 售卖语境零系统能力词（扫描清零为证）。
3. App 内、商店、官网口径一致，权益真实且可核对。
