# LuckyFields Platform: CI/CD Actions (Official Proposal)

English (primary)
- This document proposes GitHub Actions to automate cross-repo integration for LuckyFields Platform modules.
- Goals:
  - Keep app repos (e.g., kids-daily-quiz, minsei-app, schedule-planner) synced with LuckyFields-Platform
  - Automate dependency updates, version bump, and PR creation
  - Provide manual workflows to run integration on-demand

## 1) Submodule sync workflow (apps)
- Trigger: schedule (daily) + workflow_dispatch
- Purpose: Ensure submodule path LuckyFields-Platform is up-to-date, then run integration script and build smoke

Example workflow (apps/.github/workflows/platform-sync.yml):

```yaml
name: Platform Sync
on:
  schedule:
    - cron: '0 3 * * *' # daily UTC
  workflow_dispatch:
    inputs:
      modules:
        description: 'Comma-separated module list (blank = default)'
        required: false
        default: ''
      prefer:
        description: 'local or submodule'
        required: false
        default: 'local'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Run integration
        run: |
          MODS=${{ github.event.inputs.modules }}
          PREF=${{ github.event.inputs.prefer }}
          if [ -z "$MODS" ]; then MODS=""; fi
          if [ -z "$PREF" ]; then PREF="local"; fi
          node scripts/integrate-platform.cjs --modules=$MODS --prefer=$PREF
      - name: Build
        run: npm run -s build
      - name: Commit changes (if any)
        run: |
          git config user.name "github-actions"
          git config user.email "github-actions@users.noreply.github.com"
          git add -A
          git diff --quiet && echo "No changes" || git commit -m "chore(platform): sync submodule & deps"
      - name: Push changes
        if: success()
        run: |
          git push || true
```

## 2) NPM bump & PR workflow (apps)
- Trigger: workflow_dispatch
- Purpose: Switch from `file:` to a published version of modules and create a PR

Example workflow (apps/.github/workflows/platform-bump.yml):

```yaml
name: Platform Package Bump
on:
  workflow_dispatch:
    inputs:
      package:
        description: '@luckyfields/*'
        required: true
      version:
        description: 'Semver (e.g., ^1.2.3)'
        required: true

jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Update dependency
        run: |
          PKG=${{ github.event.inputs.package }}
          VER=${{ github.event.inputs.version }}
          node -e "const fs=require('fs');const p='package.json';const j=JSON.parse(fs.readFileSync(p));j.dependencies=j.dependencies||{};j.dependencies[\"'+process.env.PKG+'\"]=process.env.VER;fs.writeFileSync(p,JSON.stringify(j,null,2)+'\n');"
      - run: npm install
      - run: npm run -s build
      - name: Create PR
        uses: peter-evans/create-pull-request@v6
        with:
          commit-message: "chore(platform): bump ${{ github.event.inputs.package }} to ${{ github.event.inputs.version }}"
          title: "chore(platform): bump ${{ github.event.inputs.package }} to ${{ github.event.inputs.version }}"
          branch: "ci/platform-bump-${{ github.event.inputs.package }}"
```

## 3) Platform repo release (LuckyFields-Platform)
- Trigger: release published in LuckyFields-Platform
- Purpose: Publish changed packages (future), notify app repos or open PRs using GH App/bot

---

日本語サマリー
- 上記は LuckyFields Platform の公式 CI/CD 提案です。
- アプリ側に「サブモジュール同期 + 統合スクリプト実行」ワークフローを追加。
- npm 公開後は `file:` をバージョン参照へ置換し、PR を自動作成するフローを追加。
- 将来的には Platform 側のリリースをトリガに、アプリ側へ自動通知/PR 連携を計画します。
