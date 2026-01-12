/**
 * @description Sanitizes a string for JSON parsing by fixing quotes, escapes, and trailing commas.
 *
 * @param s - The string to sanitize.
 * 
 * @returns string
 */
export function sanitizeString(s: string): string {
    return s
    // 1) convert single-quoted strings to double-quoted
    .replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"')
    // 2) escape raw new-lines everywhere
    .replace(/\r?\n/g, '\\n')
    // 3) escape any backslash not starting a valid JSON escape
    .replace(/\\(?!["\\/bfnrtu\\])/g, '\\\\')
    // 4) quote previously-unquoted object keys
    .replace(/([,{]\s*)([A-Za-z$_][A-Za-z0-9$_]*)\s*:/g, '$1"$2":')
    // 5) strip trailing commas in objects & arrays
    .replace(/,\s*([}\]])/g, '$1');
}
