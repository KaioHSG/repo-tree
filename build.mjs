import { build } from 'esbuild';
import { readFileSync, readdirSync, mkdirSync, copyFileSync, rmSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FILES = [
  'src/style.js',
  'src/helper.js',
  'src/utils.js',
  'src/lang-loader.js',
  'src/renderer.js',
  'src/api.js',
  'src/app.js',
];

const MARKED_VERSION = require('marked/package.json').version;
const HLJS_VERSION = require('highlight.js/package.json').version;

const LANG_SRC_DIR = path.join(__dirname, 'node_modules/highlight.js/lib/languages');
const STYLES_SRC_DIR = path.join(__dirname, 'node_modules/highlight.js/styles');
const HIGHLIGHTS_DIR = 'highlights';
const LANG_OUT_DIR = path.join(HIGHLIGHTS_DIR, 'langs');
const STYLES_OUT_DIR = path.join(HIGHLIGHTS_DIR, 'styles');

// Languages registered inline in the core bundle. They are the ones that
// cover most real-world content and the auto-detect fallback used for code
// fences that do not declare a language. Everything else is fetched on demand.
const BASE_LANGS = [
  'plaintext', 'xml', 'css', 'javascript', 'json',
  'bash', 'yaml', 'python', 'markdown',
];

// ---------------------------------------------------------------------------
// Harvest grammar metadata (name, aliases, sub-language deps) by evaluating
// each language against a throwaway highlight.js core.
// ---------------------------------------------------------------------------

function pushLang(out, v) {
  if (Array.isArray(v)) { v.forEach(x => pushLang(out, x)); }
  else if (typeof v === 'string' && v) out.push(v);
}

function walkSubLanguages(modes, seen, out) {
  for (const mode of modes || []) {
    if (!mode || typeof mode !== 'object' || seen.has(mode)) continue;
    seen.add(mode);
    pushLang(out, mode.subLanguage);
    pushLang(out, mode.subLanguages);
    walkSubLanguages(mode.contains, seen, out);
    if (mode.variants) walkSubLanguages(mode.variants, seen, out);
    if (mode.endVariants) walkSubLanguages(mode.endVariants, seen, out);
    if (mode.starts) walkSubLanguages(mode.starts.contains, seen, out);
  }
}

function harvestLangMeta() {
  const core = require('highlight.js/lib/core');
  const files = readdirSync(LANG_SRC_DIR)
    .filter(f => f.endsWith('.js') && !f.endsWith('.js.js'))
    .map(f => f.slice(0, -3));

  const meta = [];
  for (const file of files) {
    try {
      const fn = require('highlight.js/lib/languages/' + file);
      core.registerLanguage(file, fn);
      const def = core.getLanguage(file);
      const subs = [...new Set((function() {
        const s = [];
        walkSubLanguages(def && def.contains, new WeakSet(), s);
        return s;
      })())];
      meta.push({
        file,
        name: (def && def.name) || file,
        aliases: (def && def.aliases) || [],
        subs,
      });
    } catch (e) {
      console.warn('SKIP language ' + file + ': ' + e.message);
    }
  }
  return meta;
}

function langIdent(file) {
  return 'lang_' + file.replace(/[^a-zA-Z0-9_]/g, '_');
}

// ---------------------------------------------------------------------------
// Build helpers
// ---------------------------------------------------------------------------

function sourceBlob() {
  return FILES.map(f => {
    const p = path.join(__dirname, f);
    if (!existsSync(p)) throw new Error('File not found: ' + f);
    return readFileSync(p, 'utf8');
  }).join('\n;\n');
}

function header() {
  return '/* Repo Tree v0.2.2 - https://github.com/KaioHSG/repo-tree\n' +
    '   LICENSE: MIT | Built: ' + new Date().toISOString().slice(0, 10) + '\n' +
    '   Bundled: marked ' + MARKED_VERSION + ', highlight.js core ' + HLJS_VERSION +
    ' (+ ' + BASE_LANGS.length + ' base languages, ' + meta.length + ' lazy modules) */\n';
}

// ---------------------------------------------------------------------------
// Metadata & maps
// ---------------------------------------------------------------------------

const meta = harvestLangMeta();
const byFile = new Map(meta.map(m => [m.file, m]));

// Names/aliases covered by the inline base set -> no fetch needed.
const baseNames = new Set();
for (const f of BASE_LANGS) {
  const m = byFile.get(f);
  if (!m) { console.warn('base language not found: ' + f); continue; }
  baseNames.add(f.toLowerCase());
  if (typeof m.name === 'string') baseNames.add(m.name.toLowerCase());
  for (const a of m.aliases || []) baseNames.add(String(a).toLowerCase());
}

// alias/name -> language module file (only non-base languages, keeps the map small).
function buildAliasMap() {
  const map = {};
  for (const m of meta) {
    if (BASE_LANGS.includes(m.file)) continue;
    const keys = [m.file.toLowerCase()];
    if (typeof m.name === 'string') keys.push(m.name.toLowerCase());
    for (const a of m.aliases || []) keys.push(String(a).toLowerCase());
    for (const k of keys) if (!(k in map)) map[k] = m.file;
  }
  return map;
}
const ALIAS_TO_FILE = buildAliasMap();

// Sub-language dependencies that are NOT satisfied by the base set.
function depsFor(m) {
  const deps = [];
  for (const sub of m.subs || []) {
    const key = String(sub).toLowerCase();
    if (key === m.file.toLowerCase()) continue;          // self-reference
    if (baseNames.has(key)) continue;                    // already in the bundle
    const depFile = ALIAS_TO_FILE[key] || (byFile.get(key) ? key : null);
    if (!depFile || depFile === m.file) continue;
    if (!deps.includes(depFile)) deps.push(depFile);
  }
  return deps;
}

// ---------------------------------------------------------------------------
// Build the core bundle
// ---------------------------------------------------------------------------

async function buildCore() {
  const imports = BASE_LANGS.map(f => `import ${langIdent(f)} from 'highlight.js/lib/languages/${f}';`).join('\n');
  const registers = BASE_LANGS.map(
    f => `try { hljs.registerLanguage(${JSON.stringify(f)}, ${langIdent(f)}); } catch (_) {}`
  ).join('\n');

  const bundledDeps = `
import * as marked from 'marked';
import hljs from 'highlight.js/lib/core';
${imports}

// Maps fence class / lang alias -> language module file for on-demand loading.
var LANG_ALIAS = ${JSON.stringify(ALIAS_TO_FILE)};

globalThis.marked = marked;
globalThis.hljs = hljs;
${registers}
`;

  await build({
    stdin: { contents: header() + bundledDeps + sourceBlob(), sourcefile: 'repo-tree.js', loader: 'js', resolveDir: __dirname },
    bundle: true,
    minify: true,
    format: 'iife',
    target: ['es2020'],
    legalComments: 'none',
    outfile: 'repo-tree.min.js',
  });

  const stat = readFileSync('repo-tree.min.js', 'utf8');
  console.log('Build OK: repo-tree.min.js (' + (stat.length / 1024).toFixed(1) + ' KB)');
}

// ---------------------------------------------------------------------------
// Build lazy language modules (one self-contained file per language)
// ---------------------------------------------------------------------------

async function ensureDir(dir) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

async function buildLangModules() {
  await ensureDir(LANG_OUT_DIR);

  let total = 0;
  let count = 0;
  for (const m of meta) {
    const deps = depsFor(m);
    const me = langIdent(m.file);
    const lines = [`import ${me} from 'highlight.js/lib/languages/${m.file}';`];
    const depIdents = [];
    for (const d of deps) {
      const di = langIdent(d);
      depIdents.push([di, d]);
      lines.push(`import ${di} from 'highlight.js/lib/languages/${d}';`);
    }
    lines.push('const __hljs = globalThis.hljs;');
    lines.push('if (__hljs) {');
    for (const [di, d] of depIdents) {
      lines.push(`  if (${di} && !__hljs.getLanguage(${JSON.stringify(d)})) { try { __hljs.registerLanguage(${JSON.stringify(d)}, ${di}); } catch (_) {} }`);
    }
    lines.push(`  if (${me} && !__hljs.getLanguage(${JSON.stringify(m.file)})) { try { __hljs.registerLanguage(${JSON.stringify(m.file)}, ${me}); } catch (_) {} }`);
    lines.push('}');

    const out = LANG_OUT_DIR + '/' + m.file + '.js';
    await build({
      stdin: { contents: lines.join('\n'), sourcefile: 'lang-' + m.file + '.js', loader: 'js', resolveDir: __dirname },
      bundle: true,
      minify: true,
      format: 'iife',
      target: ['es2020'],
      legalComments: 'none',
      outfile: out,
    });

    const size = readFileSync(out, 'utf8').length;
    total += size;
    count++;
    if (size > 60 * 1024) console.log('  big: ' + m.file + '.js (' + (size / 1024).toFixed(1) + ' KB)');
  }

  console.log('Languages OK: ' + count + ' modules, ' + (total / 1024).toFixed(1) + ' KB total -> ' + LANG_OUT_DIR);
}

// ---------------------------------------------------------------------------
// Copy the always-minified highlight.js theme stylesheets
// ---------------------------------------------------------------------------

async function buildStyles() {
  await ensureDir(STYLES_OUT_DIR);
  const files = readdirSync(STYLES_SRC_DIR)
    .filter(f => f.endsWith('.min.css'));

  let total = 0;
  for (const f of files) {
    const src = path.join(STYLES_SRC_DIR, f);
    copyFileSync(src, path.join(STYLES_OUT_DIR, f));
    total += readFileSync(path.join(STYLES_OUT_DIR, f), 'utf8').length;
  }
  console.log('Styles OK: ' + files.length + ' themes, ' + (total / 1024).toFixed(1) + ' KB total -> ' + STYLES_OUT_DIR);
}

// ---------------------------------------------------------------------------

try {
  await buildCore();
  await buildLangModules();
  await buildStyles();
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}