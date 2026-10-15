// lazy highlight assets loader
//
// The core bundle only registers a small base set (see BASE_LANGS in
// build.mjs). When a code block declares a language that is not registered
// yet, the matching module from <assets>/highlight/langs/<file>.js is fetched
// on demand and registered before highlighting. Unknown languages degrade to
// plain text. <assets> is auto-discovered from the bundle's own script URL, so
// a fully local site just needs repo-tree.min.js + the highlight/ folder side
// by side (no config); a CDN build resolves to the CDN automatically.

// Captured once while the script is executing synchronously (document.currentScript).
var ASSET_BASE = '';
if (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) {
  ASSET_BASE = document.currentScript.src.replace(/[^/]*$/, '');
}

var _langLoading = {};
var _langFailed = {};

function langBaseDir() {
  var b = (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.langBase)
    ? CONFIG.langBase
    : (ASSET_BASE + 'highlight/langs/');
  return b.replace(/\/?$/, '/');
}

function stylesBaseDir() {
  var b = (typeof CONFIG !== 'undefined' && CONFIG && CONFIG.stylesBase)
    ? CONFIG.stylesBase
    : (ASSET_BASE + 'highlight/styles/');
  return b.replace(/\/?$/, '/');
}

function loadLangScript(src) {
  return new Promise(function(resolve, reject) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = function() { resolve(); };
    s.onerror = function() { reject(new Error('failed to load ' + src)); };
    document.head.appendChild(s);
  });
}

// Fetch (once per page) the module for a language file and register it.
function ensureLangFile(file) {
  if (_langLoading[file]) return _langLoading[file];
  if (_langFailed[file]) return Promise.resolve(false);
  var p = loadLangScript(langBaseDir() + encodeURIComponent(file) + '.js')
    .then(function() { return true; })
    .catch(function() {
      _langFailed[file] = true;
      return false;
    });
  _langLoading[file] = p;
  return p;
}

// Resolve a fence language ('js', 'Python', 'cpp'...) to a module file, or
// null when it is a base language (already registered) or completely unknown.
function resolveLangFile(name) {
  var key = String(name || '').trim().toLowerCase();
  if (!key) return null;
  try { if (hljs.getLanguage(key)) return null; } catch (_) {}
  var map = (typeof LANG_ALIAS !== 'undefined' && LANG_ALIAS) ? LANG_ALIAS : {};
  return map[key] || null;
}

async function ensureLangs(names) {
  var files = [];
  for (var i = 0; i < names.length; i++) {
    var file = resolveLangFile(names[i]);
    if (file && files.indexOf(file) === -1 && !_langFailed[file]) files.push(file);
  }
  await Promise.all(files.map(ensureLangFile));
}

// Highlight every <pre><code> inside root. Blocks without a language class
// are handled by hljs auto-detection over the inline base set.
async function highlightCodeBlocks(root) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  var nodes = root.querySelectorAll('pre code');
  if (!nodes.length) return;

  var names = [];
  for (var i = 0; i < nodes.length; i++) {
    var cls = nodes[i].className || '';
    (cls.split(/\s+/)).forEach(function(t) {
      if (t.indexOf('language-') === 0) names.push(t.substring(9));
    });
  }

  await ensureLangs(names);

  for (var j = 0; j < nodes.length; j++) {
    try { hljs.highlightElement(nodes[j]); } catch (_) {}
  }
}

// Small hook for custom per-repo scripts and debugging/tests.
if (typeof globalThis !== 'undefined') {
  globalThis.repoTreeLang = {
    ensureLangs,
    highlightCodeBlocks,
    resolveLangFile,
    ensureLangFile,
  };
}