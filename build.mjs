import { build } from 'esbuild';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

const FILES = [
  'src/style.js',
  'src/helper.js',
  'template/repo-tree/config.js',
  'src/utils.js',
  'src/renderer.js',
  'src/api.js',
  'src/app.js',
];

function header() {
  return '/* Repo Tree v1.0.0 - https://github.com/KaioHSG/repo-tree\n' +
    '   LICENSE: MIT | Built: ' + new Date().toISOString().slice(0, 10) + ' */\n';
}

try {
  const source = FILES.map(f => {
    if (!existsSync(f)) throw new Error('File not found: ' + f);
    return readFileSync(f, 'utf8');
  }).join('\n;\n');

  await build({
    stdin: { contents: header() + source, sourcefile: 'repo-tree.js', loader: 'js', resolveDir: '.' },
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    legalComments: 'none',
    outfile: 'repo-tree.min.js',
  });

  console.log('✓ Build OK → repo-tree.min.js (' + (() => {
    const stat = readFileSync('repo-tree.min.js', 'utf8');
    return (stat.length / 1024).toFixed(1) + ' KB)';
  })());
} catch (err) {
  console.error('✗ Build failed:', err.message);
  process.exit(1);
}