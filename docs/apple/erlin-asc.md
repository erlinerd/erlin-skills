# erlin-asc

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

App Store Connect API 命令行工具。当用户要创建/管理 ASC 的 App 记录、Bundle ID、多语言名称、查 App 或 Build，或提到"建 App/上架准备/App Store Connect 操作"时使用。配置存 XDG JSON（只存密钥路径，不存密钥内容）。

## When to reach for it

创建/管理 App Store Connect 的 App 记录、Bundle ID、多语言名称，查询 App 或 Build，做上架准备与 ASC 相关操作时使用；提及"建 App/上架准备/App Store Connect"即触发。**本技能写外部 ASC 记录，仅用户显式调用时执行，模型不自动触发。**

## Common questions

- **密钥存哪里？**

  XDG JSON 配置只存密钥路径，不存密钥内容。

- **能做哪些操作？**

  创建/管理 App 记录、Bundle ID、多语言名称，查 App/Build，上架准备。

## It's working if

- ASC 查询/创建操作按预期返回：App 记录、Bundle ID、多语言名称在 App Store Connect 后台可见。
- 配置文件只含密钥路径，密钥内容从未落盘或回显。
- 写操作只发生在用户显式调用之后——模型不会自动触发对 ASC 的修改。
