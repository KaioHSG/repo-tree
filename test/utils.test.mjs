import test from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox } from '../test-support/sandbox.mjs';

test('escapeHtml: escapes the dangerous characters', () => {
  const { escapeHtml } = createSandbox();
  assert.equal(escapeHtml('a&b<c>d"e'), 'a&amp;b&lt;c&gt;d&quot;e');
});

test('escapeHtml: falsy input yields empty string', () => {
  const { escapeHtml } = createSandbox();
  assert.equal(escapeHtml(''), '');
  assert.equal(escapeHtml(null), '');
  assert.equal(escapeHtml(undefined), '');
});

test('getParams: short form without slash -> { repo }', () => {
  const sb = createSandbox();
  sb.window.location.search = '?my-repo';
  assert.deepEqual({ ...sb.getParams() }, { repo: 'my-repo' });
});

test('getParams: short form with file, decoded', () => {
  const sb = createSandbox();
  sb.window.location.search = '?my-repo/docs%2Fmain.js';
  assert.deepEqual({ ...sb.getParams() }, { repo: 'my-repo', file: 'docs/main.js' });
});

test('getParams: long form query pairs', () => {
  const sb = createSandbox();
  sb.window.location.search = '?q=hello&lang=javascript';
  assert.deepEqual({ ...sb.getParams() }, { q: 'hello', lang: 'javascript' });
});

test('getParams: empty search -> {}', () => {
  const sb = createSandbox();
  sb.window.location.search = '';
  assert.deepEqual({ ...sb.getParams() }, {});
});

test('isFileAllowed: enforces allowlist, blocks traversal and empty', () => {
  const sb = createSandbox();
  sb.CONFIG.allowedExtensions = ['.md'];
  assert.equal(sb.isFileAllowed('README.md'), true);
  assert.equal(sb.isFileAllowed('dir/a.MD'), true);
  assert.equal(sb.isFileAllowed('a.js'), false);
  assert.equal(sb.isFileAllowed(''), false);
  assert.equal(sb.isFileAllowed('../a.md'), false);
});

test('isFileAllowed: empty allowlist allows everything', () => {
  const sb = createSandbox();
  sb.CONFIG.allowedExtensions = [];
  assert.equal(sb.isFileAllowed('a.xyz'), true);
  assert.equal(sb.isFileAllowed('noext'), true);
});

test('isFileExcluded: blocklist by extension', () => {
  const sb = createSandbox();
  sb.CONFIG.excludeExtensions = ['.json'];
  assert.equal(sb.isFileExcluded('a.json'), true);
  assert.equal(sb.isFileExcluded('a.js'), false);
  sb.CONFIG.excludeExtensions = [];
  assert.equal(sb.isFileExcluded('a.json'), false);
});

test('getLangForExtension: maps extension, falls back to raw ext', () => {
  const sb = createSandbox();
  sb.CONFIG.extensionToLang = { '.js': 'javascript' };
  assert.equal(sb.getLangForExtension('a.js'), 'javascript');
  assert.equal(sb.getLangForExtension('a.xyz'), 'xyz');
  assert.equal(sb.getLangForExtension('noext'), '');
});

test('isRepoShown: allowlist wins over blocklist', () => {
  const sb = createSandbox();
  sb.CONFIG.allowedRepos = ['a'];
  sb.CONFIG.excludeRepos = [];
  assert.equal(sb.isRepoShown('a'), true);
  assert.equal(sb.isRepoShown('b'), false);
});

test('isRepoShown: blocklist when no allowlist', () => {
  const sb = createSandbox();
  sb.CONFIG.allowedRepos = [];
  sb.CONFIG.excludeRepos = ['x'];
  assert.equal(sb.isRepoShown('x'), false);
  assert.equal(sb.isRepoShown('y'), true);
});
