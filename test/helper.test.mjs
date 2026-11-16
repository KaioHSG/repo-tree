import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox } from '../test-support/sandbox.mjs';

const { h, anchor, img } = createSandbox();

test('h: object attrs are rendered and quote-escaped', () => {
  assert.equal(h('a', { href: 'x"y' }, 't'), '<a href="x&quot;y">t</a>');
});

test('h: null/undefined attrs are dropped, falsy non-null values kept', () => {
  assert.equal(h('br', { a: null, b: undefined, c: 0 }), '<br c="0"></br>');
});

test('h: string second argument is a class shorthand', () => {
  assert.equal(h('div', 'a b', 'x'), '<div class="a b">x</div>');
});

test('h: empty class shorthand is omitted', () => {
  assert.equal(h('div', '', 'x'), '<div>x</div>');
});

test('h: children arrays are flattened and null children skipped', () => {
  assert.equal(h('ul', null, ['<li>a</li>', '<li>b</li>']),
    '<ul><li>a</li><li>b</li></ul>');
  assert.equal(h('p', null, null, 'x', null), '<p>x</p>');
});

test('anchor: class is optional', () => {
  assert.equal(anchor('h', 'cls', 't'), '<a href="h" class="cls">t</a>');
  assert.equal(anchor('h', '', 't'), '<a href="h">t</a>');
});

test('img: class is optional', () => {
  assert.equal(img('s', 'a'), '<img src="s" alt="a"></img>');
});
