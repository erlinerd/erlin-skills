#!/usr/bin/env bash
# List all skills by bucket (matt 同构).
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
for bucket_dir in "$REPO_ROOT/skills"/*/; do
  bucket="$(basename "$bucket_dir")"
  [[ "$bucket" == "_attic" ]] && continue
  echo "$bucket:"
  for skill_dir in "$bucket_dir"*/; do
    [[ -f "$skill_dir/SKILL.md" ]] || continue
    desc="$(awk '/^description:/{sub(/^description: */,""); print; exit}' "$skill_dir/SKILL.md")"
    echo "  $(basename "$skill_dir")  —  ${desc:0:80}"
  done
done
