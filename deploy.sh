#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# deploy.sh  –  Publish Snowflake Interview Lab to GitHub Pages
# Run once after:  gh auth login
# ─────────────────────────────────────────────────────────────
set -euo pipefail

SITE="$HOME/snowflake-interview-lab"
REPO="snowflake-interview-lab"

cd "$SITE"

# ── 1. Initialise git ────────────────────────────────────────
git init -b main
git add .
git commit -m "Initial publish – Snowflake Interview Lab (13 modules + home)"

# ── 2. Create public GitHub repo and push ───────────────────
gh repo create "$REPO" \
  --public \
  --description "Interactive Snowflake interview prep – 13 modules, simulators & quizzes" \
  --push \
  --source .

# ── 3. Enable GitHub Pages (root of main branch) ────────────
gh api "repos/:owner/$REPO/pages" \
  --method POST \
  --field "source[branch]=main" \
  --field "source[path]=/" \
  2>/dev/null \
  || gh api "repos/:owner/$REPO/pages" \
       --method PUT \
       --field "source[branch]=main" \
       --field "source[path]=/"

# ── 4. Print live URL ────────────────────────────────────────
OWNER=$(gh api user --jq .login)
echo ""
echo "✅  Repo:  https://github.com/${OWNER}/${REPO}"
echo "✅  Site:  https://${OWNER}.github.io/${REPO}/"
echo ""
echo "GitHub Pages usually goes live within 1–2 minutes."
echo "Module URLs will be:"
for n in 01 02 03 04 05 06 07 08 09 10 11 12 13; do
  echo "   https://${OWNER}.github.io/${REPO}/module${n}/"
done
