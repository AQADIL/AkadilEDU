function validId(value) {
  return typeof value === 'string' && /^[a-zA-Z0-9_-]{1,128}$/.test(value);
}

function expiryTimestamp(value, now = Date.now()) {
  if (value === null || value === undefined || value === '') return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= now) throw new Error('invalid-expiry');
  return timestamp;
}

function validNotification(title, body, imageUrl) {
  if (
    typeof title !== 'string' ||
    !title.trim() ||
    title.length > 120 ||
    typeof body !== 'string' ||
    !body.trim() ||
    body.length > 2000
  )
    return false;
  if (!imageUrl) return true;
  try {
    return new URL(imageUrl).protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = { validId, expiryTimestamp, validNotification };
