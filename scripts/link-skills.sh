#!/usr/bin/env bash
# Symlink every skill into the host skill directories (matt 同构：clone 即用，无构建).
# 用法: scripts/link-skills.sh            # 全部宿主
#       TARGETS=~/.agents/skills ./scripts/link-skills.sh   # 指定目录
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
TARGETS=(${TARGETS:-$HOME/.agents/skills $HOME/.claude/skills})
# 退役桶与桶 README 不安装
SKIP_DIRS="_attic"

for target in "${TARGETS[@]}"; do
  mkdir -p "$target"
  # 清理悬空链接：技能退役/改名后 ln -sfn 不会删旧链接。
  # 只删指向本仓库 skills/ 的，不动其他来源（别的技能仓库等）的链接
  for link in "$target"/*; do
    if [[ -L "$link" && ! -e "$link" ]]; then
      dest="$(readlink "$link")"
      if [[ "$dest" == "$SKILLS_DIR"/* ]]; then
        unlink "$link"
        echo "  removed dangling $link"
      fi
    fi
  done
  for bucket in "$SKILLS_DIR"/*/; do
    bucket="$(basename "$bucket")"
    [[ " $SKIP_DIRS " == *" $bucket "* ]] && continue
    for skill_dir in "$SKILLS_DIR/$bucket"/*/; do
      name="$(basename "$skill_dir")"
      [[ -f "$skill_dir/SKILL.md" ]] || continue
      ln -sfn "$skill_dir" "$target/$name"
      echo "  $target/$name -> ${skill_dir#$REPO_ROOT/}"
    done
  done
done
echo "Done. Re-run after adding/renaming skills."
