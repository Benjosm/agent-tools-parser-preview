const separatorPatterns = [
    /^```/,
    /^---$/,
    /^\+\+\+$/,
    /^%%$/,
    /^===$/
];

/**
 * @description Checks if a line matches defined separator patterns.
 *
 * @param line - The string to check.
 * 
 * @returns boolean
 */
export function isSeparator(line: string) {
    return separatorPatterns.some(pattern => pattern.test(line));
}
