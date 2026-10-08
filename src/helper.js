// HTML helper

function escAttr(v) { return String(v).replace(/"/g, '&quot;'); }

function _h(tag, attrs) {
  let a = '';
  if (attrs) {
    const entries = Object.entries(attrs);
    for (let i = 0; i < entries.length; i++) {
      const [k, v] = entries[i];
      if (v !== null && v !== undefined && !(k === 'class' && v === ''))
        a += ' ' + k + '="' + escAttr(v) + '"';
    }
  }
  let c = '';
  for (let i = 2; i < arguments.length; i++) {
    const arg = arguments[i];
    if (Array.isArray(arg)) {
      for (let j = 0; j < arg.length; j++) {
        const x = arg[j];
        if (x !== null) c += x;
      }
    } else if (arg !== null) {
      c += arg;
    }
  }
  return '<' + tag + a + '>' + c + '</' + tag + '>';
}

function h(tag, attrs, ...children) {
  if (typeof attrs === 'string') {
    const cls = attrs.trim();
    return _h(tag, cls ? { class: cls } : null, ...children);
  }
  return _h(tag, attrs, ...children);
}

function anchor(href, cls, ...children) {
  return _h('a', { href, class: cls || undefined }, ...children);
}

function img(src, alt, cls) {
  return _h('img', { src, alt, class: cls || undefined });
}

const div   = (cls, ...children) => h('div', cls, ...children);
const p     = (cls, ...children) => h('p', cls, ...children);
const span  = (cls, ...children) => h('span', cls, ...children);
const pre   = (cls, ...children) => h('pre', cls, ...children);
const code  = (cls, ...children) => h('code', cls, ...children);