import { build } from 'esbuild';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const FILES = [
  'src/style.js',
  'src/helper.js',
  'src/utils.js',
  'src/renderer.js',
  'src/api.js',
  'src/app.js',
];

const MARKED_VERSION = require('marked/package.json').version;
const HLJS_VERSION = require('highlight.js/package.json').version;

// Dependencies bundled into repo-tree.min.js so consumers do not need to
// load marked and highlight.js via separate script tags.
const BUNDLED_DEPS = `
import * as marked from 'marked';
import hljs from 'highlight.js';

globalThis.marked = marked;
globalThis.hljs = hljs;
`;

function header() {
  return '/* Repo Tree v1.0.0 - https://github.com/KaioHSG/repo-tree\n' +
    '   LICENSE: MIT | Built: ' + new Date().toISOString().slice(0, 10) + '\n' +
    '   Bundled: marked ' + MARKED_VERSION + ', highlight.js ' + HLJS_VERSION + ' */\n';
}

try {
  const source = FILES.map(f => {
    if (!existsSync(f)) throw new Error('File not found: ' + f);
    return readFileSync(f, 'utf8');
  }).join('\n;\n');

  await build({
    stdin: { contents: header() + BUNDLED_DEPS + source, sourcefile: 'repo-tree.js', loader: 'js', resolveDir: '.' },
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    legalComments: 'none',
    outfile: 'repo-tree.min.js',
  });

  console.log('Build OK: repo-tree.min.js (' + (() => {
    const stat = readFileSync('repo-tree.min.js', 'utf8');
    return (stat.length / 1024).toFixed(1) + ' KB)';
  })());
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}