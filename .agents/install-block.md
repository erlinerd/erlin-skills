<!-- 本块是安装命令唯一源；README.md 逐字引用，改这里一处 -->
```bash
# Claude Code 插件安装（推荐）
claude plugin marketplace add erlinerd/erlin-skills
claude plugin install erlin-skills@erlinerd-erlin-skills

# 或 clone + symlink 到宿主技能目录
git clone https://github.com/erlinerd/erlin-skills.git
cd erlin-skills && ./scripts/link-skills.sh
```
