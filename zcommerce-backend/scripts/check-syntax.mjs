#!/usr/bin/env node
/** Lightweight lint: `node --check` every .js file under src/ and tests/. */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js') || p.endsWith('.mjs')) files.push(p);
  }
};
['src', 'tests', 'scripts'].forEach(walk);

let failed = 0;
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
  if (r.status !== 0) {
    failed += 1;
    console.error(r.stderr);
  }
}
console.log(`${files.length} files checked, ${failed} with syntax errors`);
process.exit(failed ? 1 : 0);
