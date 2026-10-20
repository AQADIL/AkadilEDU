const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validId, expiryTimestamp, validNotification } = require('../functions/validation');

test('administrative paths reject traversal and nested identifiers', () => {
  for (const id of ['', '../users', 'a/b', 'a.b', null, 123]) assert.equal(validId(id), false);
  assert.equal(validId('student_1-A'), true);
});

test('enrolment expiry rejects invalid and elapsed dates', () => {
  assert.equal(expiryTimestamp(null), null);
  assert.equal(expiryTimestamp(2000, 1000), 2000);
  assert.throws(() => expiryTimestamp('invalid'));
  assert.throws(() => expiryTimestamp(1000, 1000));
});

test('push input requires bounded text and HTTPS images', () => {
  assert.equal(validNotification('Update', 'A new lesson is available'), true);
  for (const args of [
    [null, 'Body'],
    [' ', 'Body'],
    ['Title', ''],
    ['Title', 'Body', 'javascript:alert(1)'],
  ]) {
    assert.equal(validNotification(...args), false);
  }
});
