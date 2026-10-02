# _attic — 退役技能归档

本目录存放已退役技能，**永不安装**（`scripts/link-skills.sh` 跳过 `_attic`，plugin.json 不含、catalog 测试不计）。目录整体保留是为了 git 历史之外还有一份可读的最后形态；不要从这里触发或引用技能。

| 技能 | 退役时间 | 去向 |
| --- | --- | --- |
| `erlin-app-dev-build` | 2026-10-02（技能库重整 27→24） | 并入 `erlin-app-icon`：dev 角标图标 + Dev 显示名见其 `references/dev-build.md` 与 `scripts/make_dev_icon.mjs` |
| `erlin-course-create` | 2026-10-02（同上） | 与 `erlin-course-review` 合并为 `erlin-course`（制作/评审双模式合一） |
| `erlin-course-review` | 2026-10-02（同上） | 同上，评审模式在 `erlin-course` 内 |
| `erlin-web-lan-preview` | 2026-10-02（同上） | 并入 `erlin-social-assets`：局域网预览画廊见其 `scripts/serve_lan.mjs` |

新增退役技能时在上表登记去向；只归档、不删除目录。
