# erlin-app-store-compliance

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

iOS App 被 App Store 审核拒绝（尤其 IAP/付费：Guideline 4.10、3.1.1）后的整改与提审前自查——Pro 卖点重定位为 App 自身高级体验，扫清禁用表达；并负责提审文案多语言化（描述/关键词/副标题翻译，默认 en-US）。用户说"被拒了""审核被拒""4.10""不能卖 iCloud""Pro 文案改改""提审前查一遍""翻译 App Store 文案""本地化商店元数据"时使用——即使没提 skill 名。

## When to reach for it

App 被拒审整改、提审前自查或提审文案多语言化时使用；用户说“被 App Store 拒了/审核被拒/4.10/不能卖 iCloud/订阅卖点整改/Pro 文案改改/提审前查一遍/翻译 App Store 文案/本地化商店元数据”即触发，无需点名本技能。范围含仓库外 RevenueCat Paywall / ASC IAP 商品的正确处理。

## Common questions

- **Guideline 4.10 是什么坑？**

  IAP/付费相关拒审主因：Pro 卖点要重定位为 App 自身高级体验，扫清 iCloud 等禁用表达。

- **提审前自查查什么？**

  描述/关键词/副标题的禁用词扫描 + 多语言化（默认 en-US）。

## It's working if

- 整改方案直指拒审条款（如 4.10/3.1.1）：Pro 卖点重定位为 App 自身高级体验，iCloud 等禁用表达清零。
- 提审前自查输出禁用词扫描结果，描述/关键词/副标题逐项过检。
- 多语言化产物（默认 en-US）术语一致，可直接粘进 App Store Connect。
