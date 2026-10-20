import DOMPurify from 'dompurify';

export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'img',
      'p',
      'b',
      'i',
      'u',
      'sup',
      'sub',
      'br',
      'span',
      'strong',
      'em',
      'div',
      'hr',
    ],
    ALLOWED_ATTR: ['src', 'alt', 'class', 'style', 'title'],
    ALLOW_DATA_ATTR: false,
  });
}

export default sanitizeHtml;
