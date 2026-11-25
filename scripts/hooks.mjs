#!/usr/bin/env node
// Installs the git pre-commit hook, which refuses Travel footage Tom
// hasn't approved (see travel-approve.mjs). Run by `pnpm install`. Written
// into git's own hooks folder rather than set with core.hooksPath, which
// would turn off the hooks Git LFS installs there.

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

let hooks
try {
  hooks = execFileSync('git', ['rev-parse', '--git-path', 'hooks'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim()
} catch {
  // Not a git checkout: nothing to install.
  process.exit(0)
}
mkdirSync(hooks, { recursive: true })
writeFileSync(
  join(hooks, 'pre-commit'),
  '#!/bin/sh\n# Installed by scripts/hooks.mjs.\nexec node scripts/travel-approve.mjs --check\n',
  { mode: 0o755 },
)
