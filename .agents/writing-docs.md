# docs 页写作模板

`docs/<bucket>/<skill>.md` 与 `skills/<bucket>/<skill>/` 一一镜像。改技能行为时同步其 docs 页；新增技能时建页；删除技能时页标 archived 保留。

四节固定顺序：

1. **What it does**：一段话，能力不是步骤。可从 SKILL.md description 派生，但要写成给人的话。
2. **When to reach for it**：触发场景列表（来自 when_to_use/keywords），加“什么时候不用”反例。
3. **Common questions**：2–4 个真实会问的问题（从使用中积累，脚手架期留 TODO）。
4. **It's working if**：可观察的成功信号——用户能复述的“它生效了”的证据。

禁止：复制 SKILL.md 的执行步骤（docs 是人读的，SKILL.md 是模型读的）；写具体文件路径（易腐）。
