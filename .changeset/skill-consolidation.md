---
'erlin-skills': patch
---

技能库重整（27 → 24）：erlin-course-create + erlin-course-review 合并为 erlin-course（制作/评审双模式）；erlin-web-lan-preview 并入 erlin-social-assets（serve_lan.mjs 随迁）；erlin-app-dev-build 并入 erlin-app-icon（references/dev-build.md + make_dev_icon.mjs 随迁）；erlin-web-wechat-download 从 apple 桶迁到 web 桶；退役四技能移入 _attic。外部技能依赖清零：erlin-meta 删除 Matt 工程流两张路由表，FLOW-MAP 主流程改为 erlin 自包含落点，arch-review/dev-standards/bdd/web-motion 正文外部引用改为等效动作。三轮审计修复随行：脚本硬编码路径改 <本技能目录>/SKILL_DIR 约定、render_icon --config 外置、social_raster 越界修复、icon_raster 像素格式守卫、verify_icon --accent-target fail-loud、marketing 假 JPEG 修复、feishu-wiki 配置外置防 token 入库、契约测试加固（description folded 形态/when_to_use/FLOW-MAP 精确匹配/meta 分节归属）。
