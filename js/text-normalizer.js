/**
 * Legal text normalization — must run before all processors.
 * Preserves line structure for regex-based line matching.
 */

export function normalizeLegalText(input) {
  if (input == null || typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
