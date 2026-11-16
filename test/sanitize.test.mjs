import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox } from '../test-support/sandbox.mjs';

function clean(html) {
  return createSandbox().sanitizeHtml(html);
}

test('sanitize: removes <script> and its content', () => {
  assert.equal(clean('<script>alert(1)</script><p>ok</p>'), '<p>ok</p>');
});

test('sanitize: strips event handler attributes', () => {
  assert.equal(clean('<img src="x" onerror="alert(1)">'), '<img src="x">');
  assert.equal(clean('<p onclick="x()">t</p>'), '<p>t</p>');
});

test('sanitize: strips style attributes', () => {
  assert.equal(clean('<p style="color:red">x</p>'), '<p>x</p>');
});

test('sanitize: removes dangerous link schemes', () => {
  assert.equal(clean('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
  assert.equal(clean('<a href="data:text/html,x">x</a>'), '<a>x</a>');
});

test('sanitize: keeps safe links', () => {
  assert.equal(clean('<a href="https://example.com">x</a>'),
    '<a href="https://example.com">x</a>');
  assert.equal(clean('<a href="./?repo/file">x</a>'), '<a href="./?repo/file">x</a>');
});

test('sanitize: image src scheme allowlist', () => {
  assert.equal(clean('<img src="javascript:alert(1)">'), '<img>');
  assert.equal(clean('<img src="data:text/html,x">'), '<img>');
  assert.ok(clean('<img src="data:image/png;base64,AAAA">')
    .includes('src="data:image/png;base64,AAAA"'));
});

test('sanitize: drops whole subtrees for active/embedded elements', () => {
  assert.equal(clean('<iframe src="x"></iframe><p>y</p>'), '<p>y</p>');
  assert.equal(clean('<object data="x"></object>'), '');
  assert.equal(clean('<svg onload="x()"><script>z</script></svg>'), '');
});

test('sanitize: preserves common markdown structure', () => {
  assert.equal(
    clean('<h2 id="hello">Hi</h2>'),
    '<h2 id="hello">Hi</h2>');
  assert.ok(clean('<pre><code class="language-js">x</code></pre>')
    .includes('<code class="language-js">x</code>'));
  assert.match(clean('<details open><summary>t</summary>body</details>'),
    /<details[^>]*\bopen\b[^>]*><summary>t<\/summary>body<\/details>/);
  assert.ok(clean('<table><tbody><tr><td>c</td></tr></tbody></table>')
    .includes('<table><tbody><tr><td>c</td></tr></tbody></table>'));
});

test('sanitize: keeps heading-anchor data attributes when safe', () => {
  const out = clean('<a class="heading-anchor" data-slug="s" data-url="./?r/f#s">x</a>');
  assert.ok(out.includes('data-slug="s"'));
  assert.ok(out.includes('data-url="./?r/f#s"'));
});

test('sanitize: drops unsafe data-url used by the heading anchor', () => {
  const out = clean('<a class="heading-anchor" data-slug="s" data-url="javascript:alert(1)">x</a>');
  assert.ok(!out.includes('javascript:'));
  assert.ok(out.includes('data-slug="s"'));
});

test('sanitize: unwraps unknown elements but sanitizes their children', () => {
  const out = clean('<foo onclick="x"><b>hi</b><script>bad</script></foo>');
  assert.equal(out, '<b>hi</b>');
});

test('sanitize: removes comments', () => {
  assert.equal(clean('<!-- x --><p>y</p>'), '<p>y</p>');
});

test('isSafeUrl: allows relative and safe absolute URLs', () => {
  const { isSafeUrl } = createSandbox();
  for (const u of ['a.png', './a.png', '/a.png', '#frag', '//host/x', 'https://x', 'http://x', 'mailto:a@b']) {
    assert.equal(isSafeUrl(u, false), true, u);
  }
});

test('isSafeUrl: blocks dangerous schemes and obfuscation', () => {
  const { isSafeUrl } = createSandbox();
  for (const u of ['javascript:alert(1)', 'JavaScript:x', 'java\tscript:x', 'data:text/html,x', 'vbscript:x', ' javascript:x']) {
    assert.equal(isSafeUrl(u, false), false, u);
  }
});

test('isSafeUrl: data images only in image context', () => {
  const { isSafeUrl } = createSandbox();
  assert.equal(isSafeUrl('data:image/png;base64,AAAA', true), true);
  assert.equal(isSafeUrl('data:image/png;base64,AAAA', false), false);
  assert.equal(isSafeUrl('data:image/svg+xml,<svg/>', true), true);
  assert.equal(isSafeUrl('data:text/html,x', true), false);
});