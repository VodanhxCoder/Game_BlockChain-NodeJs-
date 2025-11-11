// Utility function to sanitize user inputs by trimming whitespace and removing unwanted characters.
export function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[^a-zA-Z0-9@.\-_ ]/g, '');
}