// HTML sanitizer for rendered Markdown.
//
// Repo content (READMEs and other allowed files) is fetched from
// raw.githubusercontent and injected with innerHTML, so it never passes
// through GitHub's own server-side sanitizer. This allowlist pass runs on the
// parsed DOM -- parsing is inert, so nothing executes or loads while we
// inspect -- and drops scripts, event handlers and unsafe URL schemes before
// the HTML reaches the page.
//
// It is ON by default. Set CONFIG.sanitize = false to disable it for content
// you fully trust (e.g. a repo you own).

// Elements removed together with their content.
var SANITIZE_DROP = {
  script: 1, style: 1, template: 1, iframe: 1, object: 1, embed: 1, applet: 1,
  frame: 1, frameset: 1, noscript: 1, title: 1, textarea: 1, select: 1,
  form: 1, base: 1, link: 1, meta: 1, head: 1, svg: 1, math: 1,
};

// Elements kept. Anything else is unwrapped (kept as text/children, which are
// sanitized recursively), so unknown markup can't smuggle anything through.
var SANITIZE_TAGS = {
  a: 1, abbr: 1, b: 1, blockquote: 1, br: 1, caption: 1, cite: 1, code: 1,
  col: 1, colgroup: 1, dd: 1, del: 1, details: 1, dfn: 1, div: 1, dl: 1,
  dt: 1, em: 1, figcaption: 1, figure: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1,
  h6: 1, hr: 1, i: 1, img: 1, input: 1, ins: 1, kbd: 1, li: 1, mark: 1,
  ol: 1, p: 1, pre: 1, q: 1, s: 1, samp: 1, small: 1, span: 1, strong: 1,
  sub: 1, summary: 1, sup: 1, table: 1, tbody: 1, td: 1, tfoot: 1, th: 1,
  thead: 1, time: 1, tr: 1, u: 1, ul: 1, var: 1, wbr: 1,
};

// Attributes allowed on every element.
var SANITIZE_GLOBAL_ATTRS = { id: 1, class: 1, title: 1, dir: 1, lang: 1, align: 1 };

// Extra attributes allowed per tag.
var SANITIZE_ATTRS = {
  a: { href: 1, rel: 1, download: 1, 'data-slug': 1, 'data-url': 1 },
  img: { src: 1, alt: 1, width: 1, height: 1, loading: 1, decoding: 1 },
  ol: { start: 1, reversed: 1, type: 1 },
  li: { value: 1 },
  td: { colspan: 1, rowspan: 1, headers: 1, scope: 1, width: 1, height: 1 },
  th: { colspan: 1, rowspan: 1, headers: 1, scope: 1, width: 1, height: 1 },
  table: { width: 1, height: 1, summary: 1 },
  col: { span: 1, width: 1 },
  colgroup: { span: 1 },
  input: { type: 1, checked: 1, disabled: 1 },
  details: { open: 1 },
  del: { datetime: 1, cite: 1 },
  ins: { datetime: 1, cite: 1 },
  time: { datetime: 1 },
  blockquote: { cite: 1 },
  q: { cite: 1 },
};

// Attributes whose value must be a safe URL.
var SANITIZE_URL_ATTRS = { href: 1, src: 1, cite: 1, 'data-url': 1 };

var SAFE_SCHEME_RE = /^([a-z][a-z0-9+.-]*):/i;

// A URL is safe when it has no scheme (relative, fragment, protocol-relative)
// or when its scheme is explicitly allowed. `isImage` additionally permits
// data:image/* payloads for <img src>.
function isSafeUrl(url, isImage) {
  if (url === null || url === undefined) return false;
  // Strip control/whitespace chars browsers ignore when reading the scheme
  // (defeats "java\tscript:" and similar obfuscation).
  var u = String(url).replace(/[\u0000-\u0020\u007f]/g, '');
  if (u === '') return true;
  var m = SAFE_SCHEME_RE.exec(u);
  if (!m) return true;
  var scheme = m[1].toLowerCase();
  if (isImage && scheme === 'data') {
    return /^data:image\/(?:png|jpe?g|gif|webp|avif|bmp|x-icon|svg\+xml)(?:[;,]|$)/i.test(u);
  }
  return scheme === 'http' || scheme === 'https' || scheme === 'mailto';
}

function own(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function sanitizeChildren(node) {
  var kids = [];
  for (var i = 0; i < node.childNodes.length; i++) kids.push(node.childNodes[i]);
  for (var j = 0; j < kids.length; j++) {
    var child = kids[j];
    if (child.nodeType === 8) { node.removeChild(child); continue; } // comment
    if (child.nodeType === 1) sanitizeElement(child);
  }
}

function sanitizeElement(node) {
  var tag = node.tagName.toLowerCase();

  if (own(SANITIZE_DROP, tag)) { node.parentNode.removeChild(node); return; }

  if (!own(SANITIZE_TAGS, tag)) {
    // Unknown element: sanitize its subtree first, then unwrap it so its
    // (now-clean) children take its place.
    sanitizeChildren(node);
    var parent = node.parentNode;
    while (node.firstChild) parent.insertBefore(node.firstChild, node);
    parent.removeChild(node);
    return;
  }

  var extra = own(SANITIZE_ATTRS, tag) ? SANITIZE_ATTRS[tag] : null;
  var names = node.getAttributeNames();
  for (var i = 0; i < names.length; i++) {
    var name = names[i].toLowerCase();
    if (!own(SANITIZE_GLOBAL_ATTRS, name) && !(extra && own(extra, name))) {
      node.removeAttribute(names[i]);
      continue;
    }
    if (own(SANITIZE_URL_ATTRS, name) &&
        !isSafeUrl(node.getAttribute(names[i]), tag === 'img' || name === 'src')) {
      node.removeAttribute(names[i]);
    }
  }

  sanitizeChildren(node);
}

function sanitizeHtml(html) {
  if (typeof DOMParser === 'undefined') return html;
  var doc = new DOMParser().parseFromString(String(html), 'text/html');
  if (!doc || !doc.body) return html;
  sanitizeChildren(doc.body);
  return doc.body.innerHTML;
}
