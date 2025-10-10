# LuckyFields Platform Integration Workflow (Official)

English (primary) — Japanese summary at bottom

This is the official, cross-project protocol to integrate LuckyFields-Platform modules into app repos (e.g., kids-daily-quiz, minsei-app, schedule-planner).

## Goals
- Reuse shared modules consistently: `@luckyfields/*`
- Provide safe fallbacks when GitHub/package resolution fails (submodule + file:)
- Keep TypeScript/ESM imports stable across environments

## Modules and locations
- Every module lives under `packages/{module-name}` in LuckyFields-Platform repo
- Canonical modules: `blobs-utils`, `functions-utils`, `api-utils`, `config-utils`, `ui-components`, `hooks`, `diagnostics`

## Integration options
1) GitHub submodule + file: dependency (recommended during active development)
2) npm workspace (future monorepo), or
3) Published package from npm registry (recommended for stable releases)

## Fast path (automation)
- Use the VS Code task: `platform:integrate`
- It runs: `node scripts/integrate-platform.cjs` with defaults
- Script behavior:
  - Ensures submodule initialization (unless `--skip-submodule`)
  - Sets dependencies to `file:` for all known modules, preferring local `packages/` then submodule path
  - Cleans lock/cache and runs `npm install` (unless `--skip-install`)
  - Verifies ESM import for each targeted module

CLI options:
- `--modules=blobs-utils,functions-utils` (defaults to all)
- `--prefer=local|submodule` (default: local)
- `--skip-install`, `--skip-submodule`

## Manual steps (if not using the script)
1) Add submodule (once):
   - `git submodule add https://github.com/LuckyFieldsLLC/LuckyFields-Platform.git LuckyFields-Platform`
   - `git submodule update --init --recursive`
2) Set dependencies in `package.json` to `file:` paths, module by module:
   - Prefer `file:packages/{module}`; fallback `file:LuckyFields-Platform/packages/{module}`
3) Clean install:
   - Remove `package-lock.json`, run `npm cache clean --force`, then `npm install`
4) Verify import (ESM):
   - `import * as mod from '@luckyfields/{module}'` and ensure exports resolve

## Troubleshooting
- ENOENT that references a local absolute path
  - Remove lock, clean cache, revert to trusted `file:` spec, reinstall
- Module cannot be imported
  - Ensure `package.json` dependency is correct and installed
  - Use Node 20+ and ESM

## Migration to npm registry
- Once a module is published, replace `file:` with a semver range (e.g., `^1.2.3`)
- Confirm build passes, then prefer GitHub Action-based PR bumps (see `PLATFORM-ACTIONS.md`)

---

日本語サマリー
- 本ドキュメントは LuckyFields Platform の公式統合プロトコルです。
- まずは submodule + file: を推奨（開発中）。安定後は npm 公開版へ移行してください。
- `platform:integrate` タスクまたは `scripts/integrate-platform.cjs` で全モジュールを自動処理できます。
