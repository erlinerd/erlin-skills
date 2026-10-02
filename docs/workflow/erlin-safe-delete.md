# erlin-safe-delete

> What it does / When / Questions / It's working if —— 模板见 [.agents/writing-docs.md](../../.agents/writing-docs.md)。改技能行为必须同步本页。

## What it does

本机文件/目录/缓存的删除纪律——删除前先列清单（路径+实测大小）请用户确认，批准后移入废纸篓而不是直接删；适用于用户资产与系统清理；已授权代码删改和本次自建无用临时物不另设审批。

## When to reach for it

用户资产或系统清理落地之前：手工删目录/文件、包管理器缓存清理（brew cleanup、npm cache clean、pnpm store prune）、模拟器擦除等。与 erlin-dev-standards 分工：那边管 git/仓库内破坏性操作的授权门禁，这边管整机文件系统删除的执行方式。

## Common questions

- **删除前必须做什么？**

  列清单（路径+实测大小）请用户确认，批准后移废纸篓而非直接删。

- **哪些删除不需要确认？**

  已授权的代码删改、本次会话自建且确认无用的临时物。

## It's working if

- 删除执行前收到确认清单：每项带路径与实测大小，没有"先删了再说"。
- 批准后的文件进废纸篓且可找回，而不是直接消失。
- 未获批准的项原地未动；已授权代码删改和本次自建临时物没有多问一轮。
