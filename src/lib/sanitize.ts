// HTML-escape user inputs to prevent XSS
export function sanitize(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Sanitize all string fields in an object (shallow)
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (typeof result[key] === 'string') {
      (result as any)[key] = sanitize(result[key] as string);
    }
  }
  return result;
}

// Strip HTML tags completely
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}
