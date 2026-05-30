import DOMPurify from 'dompurify';

// Shared HTML sanitizer for questions, options, and admin previews
// Allowed tags kept minimal and inline-only for security.
export function sanitizeHtml(html) {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['img', 'p', 'b', 'i', 'u', 'sup', 'sub', 'br', 'span', 'strong', 'em', 'div', 'hr'],
    ALLOWED_ATTR: ['src', 'alt', 'class', 'style', 'title'],
    ALLOW_DATA_ATTR: false,
  });
}

export default sanitizeHtml;
