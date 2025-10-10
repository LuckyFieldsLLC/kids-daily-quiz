#!/usr/bin/env node
/*
  LuckyFields Platform integration helper (multi-module)
  - Adds/updates LuckyFields-Platform submodule (if missing)
  - Ensures dependencies on @luckyfields/* modules via file: (prefer local packages/, fallback to submodule)
  - Optionally runs clean install (lock/cache) and verifies ESM import for each processed module

  Usage:
    node scripts/integrate-platform.cjs [--skip-install] [--skip-submodule] [--modules=blobs-utils,functions-utils] [--prefer=local|submodule]

  Default modules (in order):
    blobs-utils, functions-utils, api-utils, config-utils, ui-components, hooks, diagnostics
*/

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const root = path.resolve(__dirname, '..');
const submoduleDir = path.join(root, 'LuckyFields-Platform');
const DEFAULT_MODULES = [
  'blobs-utils',
  'functions-utils',
  'api-utils',
  'config-utils',
  'ui-components',
  'hooks',
  'diagnostics',
];

const argv = process.argv.slice(2);
const args = new Set(argv);
const SKIP_INSTALL = args.has('--skip-install');
const SKIP_SUBMODULE = args.has('--skip-submodule');
const modulesArg = (argv.find(a => a.startsWith('--modules=')) || '').split('=')[1];
const preferArg = (argv.find(a => a.startsWith('--prefer=')) || '').split('=')[1];

const PREFER = preferArg === 'submodule' ? 'submodule' : 'local';
const TARGET_MODULES = modulesArg
  ? modulesArg.split(',').map(s => s.trim()).filter(Boolean)
  : DEFAULT_MODULES;

function log(step, msg) {
  console.log(`[${step}] ${msg}`);
}

function run(cmd, opts = {}) {
  const def = { cwd: root, stdio: 'inherit', shell: true }; // shell:true for Win/Pwsh compat
  cp.execSync(cmd, { ...def, ...opts });
}

function tryRun(cmd) {
  try {
    run(cmd);
    return true;
  } catch (e) {
    return false;
  }
}

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}

(async function main() {
  log('start', `LuckyFields Platform integration start (modules: ${TARGET_MODULES.join(', ')}, prefer: ${PREFER})`);

  // 1) Ensure we are in a git repo (best-effort)
  if (!tryRun('git rev-parse --is-inside-work-tree')) {
    log('warn', 'Not inside a git repository or git not available. Proceeding anyway.');
  }

  // 2) Add submodule if needed
  if (!SKIP_SUBMODULE) {
    if (!fs.existsSync(submoduleDir)) {
      log('submodule', 'Adding LuckyFields-Platform as a submodule...');
      if (!tryRun('git submodule add https://github.com/LuckyFieldsLLC/LuckyFields-Platform.git LuckyFields-Platform')) {
        log('submodule', 'Submodule add failed or already exists. Continuing.');
      }
      tryRun('git submodule update --init --recursive');
    } else {
      log('submodule', 'Submodule exists. Updating to ensure it is initialized...');
      tryRun('git submodule update --init --recursive');
    }
  } else {
    log('submodule', 'Skipping submodule step (--skip-submodule)');
  }

  // 3) Ensure dependencies point to working file: paths for each module
  const pkgFile = path.join(root, 'package.json');
  const pkg = readJSON(pkgFile);
  pkg.dependencies = pkg.dependencies || {};

  const changed = [];

  for (const mod of TARGET_MODULES) {
    const localDir = path.join(root, 'packages', mod);
    const subDir = path.join(submoduleDir, 'packages', mod);
    const name = `@luckyfields/${mod}`;

    let spec = null;
    if (PREFER === 'local') {
      if (fs.existsSync(localDir)) spec = `file:packages/${mod}`;
      else if (fs.existsSync(subDir)) spec = `file:LuckyFields-Platform/packages/${mod}`;
    } else {
      if (fs.existsSync(subDir)) spec = `file:LuckyFields-Platform/packages/${mod}`;
      else if (fs.existsSync(localDir)) spec = `file:packages/${mod}`;
    }

    if (!spec) {
      log('deps', `Skip ${name}: not found in local or submodule`);
      continue;
    }

    const current = pkg.dependencies[name];
    if (current !== spec) {
      log('deps', `Setting ${name} -> ${spec}`);
      pkg.dependencies[name] = spec;
      changed.push(name);
    } else {
      log('deps', `${name} already set to ${spec}`);
    }
  }

  if (changed.length) writeJSON(pkgFile, pkg);

  // 4) Clean install
  if (!SKIP_INSTALL) {
    const lockFile = path.join(root, 'package-lock.json');
    if (fs.existsSync(lockFile)) {
      log('install', 'Removing package-lock.json');
      fs.rmSync(lockFile);
    }
    log('install', 'Cleaning npm cache (force)');
    tryRun('npm cache clean --force');
    log('install', 'Running npm install');
    run('npm install');
  } else {
    log('install', 'Skipping install (--skip-install)');
  }

  // 5) Verify ESM import works for each module
  let verifyFailed = [];
  for (const mod of TARGET_MODULES) {
    const name = `@luckyfields/${mod}`;
    try {
      const imported = await import(name);
      const keys = Object.keys(imported || {});
      log('verify', `Import OK: ${name} exports: ${keys.join(', ')}`);
    } catch (e) {
      console.error(`[verify] Import failed for ${name}`);
      console.error(e && e.stack ? e.stack : e);
      verifyFailed.push(name);
    }
  }

  if (verifyFailed.length) {
    console.error(`[verify] Some modules failed to import: ${verifyFailed.join(', ')}`);
    process.exit(1);
  } else {
    process.exit(0);
  }
})();
