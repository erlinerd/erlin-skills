---
name: erlin-feishu-wiki
maturity: in-progress
description: 用官方 @larksuite/cli（lark-cli）维护飞书知识库文档——本地 markdown 草稿 → 安全上传 → markdown 回查。用户提到"飞书文档/知识库/wiki 页""上传/更新/回查飞书页面""lark-cli 操作 wiki""多页批量覆盖并验证"时使用。**整篇覆盖远端页面：仅用户显式调用本技能时执行，模型不自动触发。**
when_to_use: 用 lark-cli 上传/更新/回查飞书知识库文档——本地 Markdown 草稿 dry-run 确认后整篇覆盖上传并远端回查验证时使用；提及"飞书文档/知识库/wiki 页/lark-cli 操作 wiki"即触发。**写远端页面，仅用户显式调用时执行，模型不自动触发。**
disable-model-invocation: true
keywords:
  - 飞书文档
  - 飞书知识库
  - 飞书页面
  - 回查飞书
  - lark-cli
  - wiki 页面
---

# 目标

用官方 @larksuite/cli（lark-cli）维护飞书知识库文档：把本地 Markdown 当事实源，按 **读取/编辑 → 显式确认后上传 → 远端 Markdown 回查** 维护飞书文档。上传脚本默认读取 `.erlin/course/`，也可以通过 `DRAFT_DIR` 环境变量指定其他草稿目录。工作纸模板与本地课程产物由 `erlin-learning-plan` 负责；本技能只负责上传和回查。

# 执行步骤

0. **环境自检**：确认 `lark-cli` 已安装（`command -v lark-cli`）；未安装先 `npm i -g @larksuite/cli` 并走 `lark-cli auth login` 完成授权，再继续。
1. **先读本地和远端**：确认目标文件、文档 token、当前远端版本；不对未读文件做覆盖编辑。
2. **本地完成修改**：把内容保存为 Markdown，先检查链接、标题和占位符。
3. **先做 dry-run**：确认目标文件、token 和覆盖命令无误；dry-run 不改变远端。
4. **显式覆盖上传**：只有用户明确确认整篇覆盖后，才执行 `upload --confirm-overwrite`。
5. **远端回查**：使用 `--doc-format markdown` 读取 `data.document.content`，按关键词和期望计数断言。
6. **失败即失败**：上传异常、API 返回 `ok=false`、回查断言缺失/计数错误都必须以非零退出码结束。

```sh
# 单页 dry-run：先确认命令，不改变远端
lark-cli docs +update --doc <token> --command overwrite \
  --doc-format markdown --content @./.erlin/course/00-home.md --as user --dry-run

# 单页上传：用户确认后再执行整篇覆盖
lark-cli docs +update --doc <token> --command overwrite \
  --doc-format markdown --content @./.erlin/course/00-home.md --as user

# 单页回查：显式要求 Markdown，避免拿到 DocxXML
lark-cli docs +fetch --doc <token> --doc-format markdown --as user

# 批量脚本：默认只读回查；先 dry-run，再确认上传
SKILL_DIR="<本技能目录>"  # 宿主注入的技能实际安装路径
node "$SKILL_DIR/assets/upload_verify.mjs" verify
node "$SKILL_DIR/assets/upload_verify.mjs" upload --dry-run
node "$SKILL_DIR/assets/upload_verify.mjs" upload --confirm-overwrite
node "$SKILL_DIR/assets/upload_verify.mjs" both --confirm-overwrite
```

**脚本配置**：**不要编辑脚本本身**——技能目录经 symlink 就是 erlin-skills 的 git 工作树，真实 token 写进脚本顶部会被一次 commit 带进公开历史。配置写到项目内 JSON（加入 `.gitignore`），用环境变量指给脚本：

```sh
# .erlin/feishu-config.json（gitignore，不进 git）
{ "T": { "00-home": "<doc-token>" },
  "KEYS": { "00-home": { "源码目录树": 1, "一次": 1 } } }

FEISHU_WIKI_CONFIG=.erlin/feishu-config.json node "$SKILL_DIR/assets/upload_verify.mjs" verify
```

`T` 是文件名到文档 token 的映射；`KEYS` 是每页必须出现的文本到期望出现次数的映射。脚本会拒绝空配置，不会把“没有断言”报告为“全部命中”。默认草稿目录是 `.erlin/course/`，启动前会检查本地文件存在。

**授权与身份**：数据读写命令显式使用 `--as user`。`auth login` 是例外：它是授权流程命令，不接受这个数据身份参数。

```sh
# 申请新 scope：拿到 device_code 与 verification_url
lark-cli auth login --scope "<scope名>" --no-wait --json

# 把 verification_url 原样交给用户完成授权；用户确认后再续轮询
lark-cli auth login --device-code <device_code>

# 查看已授权 scope
lark-cli auth status
```

# 判断规则

CLI 踩坑与原因：

1. **`--content` 使用相对路径**：写 `@./.erlin/course/xxx.md`，先在项目根运行。CLI 按当前工作目录解析；绝对路径可能无法通过校验。
2. **`+fetch` 显式使用 Markdown**：默认格式可能是 DocxXML，不适合章节 diff 和关键词断言。
3. **解析 JSON 正文**：CLI 输出可能带 banner；从第一个 `{` 解析 JSON，正文在 `data.document.content`。解析失败必须报错并返回非零。
4. **先读再改**：本地文件和远端页面都要先读；远端回查是整篇覆盖后的证据，不是上传成功的替代品。
5. **一次编辑只处理一个文件**：不同文件的编辑必须分开传入，避免多个导览写入同一个 path。若草稿损坏，从远端 `+fetch --doc-format markdown` 拉回上一版再恢复。
6. **不要用 macOS Bash 3.2 的 `declare -A`**：它不支持关联数组，批量映射可能变空。脚本使用 Node 对象和 `execFileSync` 参数数组。
7. **确认 JSON 字段再取数**：不同 `base` 子命令字段名不同；先检查 `ok` 和 `data`，不要把缺 scope 误当空结果。
8. **按错误 hint 申请 scope**：写/删操作遇到 `missing_scope` 时，使用 CLI 返回的确切 scope 名，不猜名称。
9. **破坏性操作需要确认**：例如 `base +table-delete` 需要 `--yes`；文档整篇覆盖需要脚本的 `--confirm-overwrite`。
10. **飞书表格避免相邻行内 code span**：多个目录用“与/、”连接，目录树放进 fenced code block 更稳定；否则渲染器可能把两个目录合成一个名称。

# 输出格式

- `T`：文件名 → 文档 token 的映射；`KEYS`：每页必须出现的文本 → 期望出现次数的映射；脚本拒绝空配置。
- 回查断言用关键词 + 期望计数（例如“本篇导览”必须恰好出现 1 次），不是只检查“存在”——只检查存在抓不住重复插入。
- 多页操作逐页显示文件名、结果和 revision；任何一页失败，批次最终非零。

# 示例

## 用户问题

“把 .erlin/course/ 里的导览页更新到飞书知识库，上传后回查验证”“多页批量覆盖并验证”。

## 工具返回

### lark-cli docs +update

dry-run 不改变远端；用户确认后整篇覆盖上传，返回体带 `ok` 字段。

### lark-cli docs +fetch --doc-format markdown

返回 JSON（输出可能带 banner，从第一个 `{` 解析），正文在 `data.document.content`，用于关键词与期望计数断言。

### upload_verify.mjs

`verify` 只读回查，逐页显示文件名、结果和 revision；断言缺失/计数错误以非零退出码结束。

## 最终输出

远端页面与本地 Markdown 一致：整篇覆盖上传成功，且远端 Markdown 回查的关键词/计数断言全部命中；多页批次逐页通过、revision 更新。

# 门禁

- 不对未读文件做覆盖编辑；本地文件和远端页面都要先读。
- 只有用户明确确认整篇覆盖后，才执行 `upload --confirm-overwrite`；覆盖前先确认目标文档与本地文件匹配，不能把旧远端内容当新上传成功。
- 失败即失败：上传异常、API 返回 `ok=false`、回查断言缺失/计数错误、JSON 解析失败都必须以非零退出码结束。
- 数据读写命令显式使用 `--as user`。
- 不要把 device code、token、个人姓名、Open ID 写进技能、脚本、日志或提交；`verification_url` 是不透明字符串，不要编码、加空格或缓存旧链接。
- 远端回查是整篇覆盖后的证据，不是上传成功的替代品。
