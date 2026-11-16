// Test sandbox: loads the real browser sources (config + helper + utils +
// sanitize + renderer) into a single shared scope, exactly the way build.mjs
// concatenates them, and exposes their top-level functions/consts for unit
// testing.
//
// Only the dependency-free, DOM-free units are loaded here. app.js / api.js /
// lang-loader.js run side effects at load time (they touch document or kick off
// network calls), so they are covered by the syntax check instead.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
import { parseHTML } from 'linkedom';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.join(__dirname, '..');

const SOURCES = [
  'template/repo-tree/config.js',
  'src/helper.js',
  'src/utils.js',
  'src/sanitize.js',
  'src/renderer.js',
];

// Names exposed on the concatenated script's top-level scope. `const`/`let`
// bindings are not properties of the vm global, so the footer below re-exports
// them explicitly.
const EXPORTS = [
  'escapeHtml',
  'h', 'anchor', 'img',
  'getParams', 'isFileAllowed', 'isFileExcluded',
  'getLangForExtension', 'isRepoShown',
  'isSafeUrl', 'sanitizeHtml',
  'createRenderer',
  'USER', 'RAW_BASE', 'CONFIG', 'SORT_OPTIONS', 'UI',
];

// linkedom parses full documents, while the browser's DOMParser handles the
// fragment markup marked emits. Wrap it so the sanitizer runs against a
// browser-shaped document whose `.body` holds the parsed fragment.
class TestDOMParser {
  parseFromString(html) {
    const { document } = parseHTML(
      '<!doctype html><html><head></head><body><div id="__root__"></div></body></html>'
    );
    const root = document.getElementById('__root__');
    root.innerHTML = String(html);
    return { body: root };
  }
}

export function createSandbox() {
  const code = SOURCES
    .map(f => readFileSync(path.join(ROOT, f), 'utf8'))
    .join('\n;\n') + '\n;globalThis.__exports = { ' + EXPORTS.join(', ') + ' };';

  const windowStub = { location: { search: '', pathname: '/', hash: '' } };

  const context = vm.createContext({
    window: windowStub,
    document: undefined,
    DOMParser: TestDOMParser,
    console,
    Date,
    URLSearchParams,
  });

  vm.runInContext(code, context, { filename: 'repo-tree-sources.js' });

  return { ...context.__exports, window: windowStub };
}
