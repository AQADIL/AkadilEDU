const { test } = require('node:test');
const assert = require('node:assert/strict');

test('material links reject executable protocols and embedded credentials', async () => {
  const { normalizeExternalUrl } = await import('../src/utils/urls.js');
  for (const url of [
    'javascript:alert(1)',
    'data:text/html,test',
    'http://example.com',
    'https://name:password@example.com',
    null,
  ]) {
    assert.equal(normalizeExternalUrl(url), null);
  }
  assert.equal(normalizeExternalUrl('example.com/lesson'), 'https://example.com/lesson');
  assert.equal(
    normalizeExternalUrl('https://example.com/file/d/lesson/view'),
    'https://example.com/file/d/lesson/view',
  );
});
