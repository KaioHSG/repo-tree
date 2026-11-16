// Syntax-only guard for the files that can't be unit-loaded in the sandbox
// (they touch the DOM or the network at load time). Compiling a vm.Script runs
// no code but fails on any parse error.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { ROOT } from '../test-support/sandbox.mjs';

const srcDir = path.join(ROOT, 'src');
const files = readdirSync(srcDir)
  .filter(f => f.endsWith('.js'))
  .map(f => path.join('src', f))
  .concat(['repo-tree.min.js']);

for (const rel of files) {
  test('parses: ' + rel, () => {
    const code = readFileSync(path.join(ROOT, rel), 'utf8');
    assert.doesNotThrow(() => new vm.Script(code, { filename: rel }), rel);
  });
}
