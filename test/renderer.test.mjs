import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox } from '../test-support/sandbox.mjs';

test('heading: slug, id and anchor url', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  const out = r.heading('Hello World', 2);
  assert.match(out, /<h2 id="hello-world">/);
  assert.ok(out.includes('href="./?myrepo/README.md#hello-world"'));
  assert.ok(out.includes(sb.UI.anchorIcon));
});

test('heading: strips inline html from the slug', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  assert.match(r.heading('<em>Hi</em> There', 1), /id="hi-there"/);
});

test('link: external urls pass through', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  assert.equal(r.link('https://example.com', null, 'x'),
    '<a href="https://example.com">x</a>');
});

test('link: relative .md resolves against the current directory', () => {
  const sb = createSandbox();
  sb.CONFIG.allowedExtensions = ['.md'];
  const r = sb.createRenderer('myrepo', 'main', 'docs/guide.md');
  assert.equal(r.link('other.md', null, 'Other'),
    '<a href="./?myrepo/docs%2Fother.md">Other</a>');
});

test('link: .md anchor hash is preserved', () => {
  const sb = createSandbox();
  sb.CONFIG.allowedExtensions = ['.md'];
  const r = sb.createRenderer('myrepo', 'main', 'docs/guide.md');
  assert.match(r.link('other.md#sec', null, 'o'), /href="\.\/\?myrepo\/docs%2Fother\.md#sec"/);
});

test('link: disallowed extension falls back to the raw href', () => {
  const sb = createSandbox();
  sb.CONFIG.allowedExtensions = ['.md'];
  const r = sb.createRenderer('myrepo', 'main', 'docs/guide.md');
  assert.equal(r.link('note.txt', null, 'n'), '<a href="note.txt">n</a>');
});

test('link: non-markdown relatives are left as-is', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  assert.equal(r.link('img/x.png', null, 'p'), '<a href="img/x.png">p</a>');
});

test('image: relative sources resolve against the raw base', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  const out = r.image('./img/a.png');
  assert.ok(out.includes(sb.RAW_BASE + '/myrepo/main/img/a.png'));
  assert.ok(out.includes('loading="lazy"'));
});

test('image: shields.io style/color are overridden, others kept', () => {
  const sb = createSandbox();
  sb.UI.shields = { style: 'plastic', color: '00cec9' };
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  const out = r.image('https://img.shields.io/badge/build-passing-blue?style=flat&logo=github');
  assert.ok(out.includes('style=plastic'));
  assert.ok(out.includes('color=00cec9'));
  assert.ok(out.includes('logo=github'));
});

test('code: language class and html escaping', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  assert.equal(r.code('x<y', 'js'),
    '<pre><code class="language-js">x&lt;y</code></pre>\n');
});

test('text/br/hr: trivial passthrough', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  assert.equal(r.text('x'), 'x');
  assert.equal(r.br(), '<br>\n');
  assert.equal(r.hr(), '<hr>\n');
});

test('link: dangerous scheme is neutralised to plain text', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  assert.equal(r.link('javascript:alert(1)', null, 'x'), 'x');
  assert.equal(r.link('data:text/html,x', null, 'x'), 'x');
});

test('image: dangerous scheme is dropped', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  assert.equal(r.image('javascript:alert(1)'), '');
});

test('image: safe data:image is used as-is (not prefixed with the raw base)', () => {
  const sb = createSandbox();
  const r = sb.createRenderer('myrepo', 'main', 'README.md');
  assert.ok(r.image('data:image/png;base64,AAAA').includes('src="data:image/png;base64,AAAA"'));
});
