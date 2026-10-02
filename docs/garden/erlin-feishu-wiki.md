# erlin-feishu-wiki

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

用官方 @larksuite/cli（lark-cli）维护飞书知识库文档——本地 markdown 草稿 → 安全上传 → markdown 回查。用户提到"飞书文档/知识库/wiki 页""上传/更新/回查飞书页面""lark-cli 操作 wiki""多页批量覆盖并验证"时使用。**整篇覆盖远端页面：仅用户显式调用本技能时执行，模型不自动触发。**

## When to reach for it

用 lark-cli 上传/更新/回查飞书知识库文档——本地 Markdown 草稿 dry-run 确认后整篇覆盖上传并远端回查验证时使用；提及"飞书文档/知识库/wiki 页/lark-cli 操作 wiki"即触发。**写远端页面，仅用户显式调用时执行，模型不自动触发。**

## Common questions

- **为什么只支持覆盖上传？**

  刻意最小化：markdown 单向覆盖+回查验证，避免双向同步冲突。

- **需要什么授权？**

  lark-cli 的 scope 授权，首次使用会引导。

## It's working if

- 上传前先 dry-run 给出差异确认，确认后才整篇覆盖远端页面。
- 上传后回查验证：远端内容与本地 markdown 一致，不是"发出去就算成功"。
- 未经用户显式调用，远端页面零改动——覆盖操作永远有人拍板。
