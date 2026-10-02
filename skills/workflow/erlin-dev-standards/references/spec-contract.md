# Spec 契约标准

本索引承载 `erlin-dev-standards` 的任务级规格（Spec）标准。签名级契约（函数出入参）见《工程改动纪律》§6.2；本文件管整个任务的契约。

## 0. Spec 是什么

**Spec = 任务级契约**：动手前钉死该任务的对外承诺——

- 给它什么：Inputs、Preconditions；
- 它保证什么：Outputs、Postconditions、Invariants、Acceptance Criteria；
- 失败时发生什么：Errors / Failure Modes；
- 对外界造成什么：Side Effects；
- 明确不碰什么：Scope、Out of Scope。

Spec 不写"怎么做"——实现步骤、代码组织、方法选择不属于 Spec，由实现纪律与工程方法承接。Spec 只钉死"做成什么样、怎么算成、怎么算败"，让未参与原始讨论的 agent 能独立实现并独立验收。

## 1. 何时必须写 Spec

按任务复杂度分级，与 `erlin-autopilot` 的 Classify 对齐：

- **small**（局部修改、无新公共接口、影响面小）：可不写正式 Spec，按风险使用现有检查或必要回归测试。
- **medium**（多模块、新行为、新接口、新状态变化）：必须 Spec。
- **large**（架构变化、migration、多个独立 vertical slice）：Spec + 任务依赖图。

凡涉及以下任一项，按 medium 起步：跨模块改动、公共 API、状态机、持久化 schema、事件、外部集成。

## 2. 验收线

另一个**没有参与原始讨论的 agent，仅凭 Spec 就应该能基本正确实现任务**。达不到这条线的 Spec 不算完成。

## 3. 必备字段

| 字段 | 内容 |
| --- | --- |
| Goal | 要达成什么，一句话 |
| Context | 背景、关联决策、既有约束 |
| Scope | 改动范围（模块/文件/接口层面） |
| Inputs | 输入数据/依赖服务的形态与来源 |
| Outputs | 产出的数据/接口/行为 |
| Preconditions | 执行前必须成立的状态 |
| Postconditions | 执行后保证成立的状态 |
| Errors / Failure Modes | 每类失败的触发条件与处理方式 |
| Side Effects | 对外部的可见影响（IO、事件、缓存、账单…） |
| Invariants | 全程必须保持成立的性质 |
| Acceptance Criteria | 可判定的验收条件清单 |
| Out of Scope | 明确不做的事 |
| Test Strategy | 各层怎么验（定向/套件/集成/E2E） |

medium 至少覆盖：Inputs、Outputs、Preconditions、Postconditions、Errors / Failure Modes、Side Effects、Invariants、Acceptance Criteria；其余按需补。large 的每个实现任务另含：Dependencies、Required Tests、Branch、Base Branch。

Spec 与 BDD 只接线、不复述：命中 `erlin-bdd` 触发线的行为密集/大模块任务，Acceptance Criteria 直接以 Given/When/Then 场景表达，并沉淀为 `docs/bdd/*.md` 场景规格；何时必须出场景、场景格式与测试分层，唯一权威是 `erlin-bdd`。

## 4. 模糊描述禁令

以下写法不合格，必须落成明确契约、行为与失败模式：

- "send user data" → 发什么字段、到哪个端点、何种格式、失败重试几次、失败后用户看到什么；
- "return result" → 返回类型、成功/失败各自的形状、空态语义；
- "handle errors" → 列出每类错误码/异常与对应处置（重试、降级、报错文案、终止）；
- "update state" → 哪个状态、从什么值变成什么值、并发更新时谁赢、持久化时机。

## 5. 产出与确认

已有明确需求和授权时，Spec 可直接作为实现与派发依据，不重复审批。仅未决的产品语义、公共兼容性或授权边界需要用户决策；内部签名由实现者按项目约定确定。
