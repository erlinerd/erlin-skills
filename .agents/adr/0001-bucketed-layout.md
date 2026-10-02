# ADR 0001：skills 目录采用四领域桶 + _attic 退役桶

日期：2026-10-02　状态：已接受（已实施）

## 背景

27 个技能原平铺在 `packages/resources/skills/`，分类全靠 `erlin-*` 前缀字母巧合；无退役路径；布局不变式仅一半被机器校验。mattpocock/skills 用五桶（engineering/productivity/misc/in-progress/deprecated）表达生命周期与发布集。

## 决策

- 四领域桶：`workflow`（主流程与规范评审）、`apple`（上架链与平台规范）、`web`（Web 动效与物料）、`garden`（个人与沉淀）。
- 退役路径：`_attic/` 物理桶（下划线开头，安装器与遍历跳过）+ frontmatter `status: deprecated` + `replaced_by` 字段。
- 布局感知唯一入口：core 的 `skill-metadata` 模块；CLI 只消费清单。
- 校验升级为三向：目录 ↔ erlin-meta 路由表 ↔ FLOW-MAP 落位。

## 否决的备选

- **五桶照搬**：`misc`/`in-progress` 对本仓库是空桶；空桶是投机性结构。
- **deprecated 物理桶**：与 `_attic`+status 相比少上下文（继任者指针、豁免粒度），弃。
- **前缀当分类**：动 `erlin-` 前缀波及全部 frontmatter 与肌肉记忆，收益为零，保留前缀只作命名空间。

## 后果

- 新技能放桶 = 一次目录选择；跨桶迁移 = `git mv` + meta 表行不动（校验按 name）。
- matt 的桶名（engineering/productivity）未采用：桶概念一致，名字领域为真。
