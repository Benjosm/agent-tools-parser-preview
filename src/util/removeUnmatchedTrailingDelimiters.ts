/**
 * @description Removes unmatched or redundant trailing Markdown code fences and empty lines from an array of strings.
 *
 * @param lines - The array of lines to process.
 * 
 * @returns string[]
 */
export function removeUnmatchedTrailingDelimiters(lines: string[]): string[] {
  // Find index of last meaningful line
  let lastMeaningfulIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed !== '' && trimmed !== '```') {
      lastMeaningfulIndex = i;
      break;
    }
  }
  
  // If no meaningful lines found, return empty array
  if (lastMeaningfulIndex === -1) {
    lines.length = 0;
    return lines;
  }
  
  // Count fences in meaningful part (0 to lastMeaningfulIndex)
  let meaningfulFences = 0;
  for (let i = 0; i <= lastMeaningfulIndex; i++) {
    if (lines[i].trim() === '```') {
      meaningfulFences++;
    }
  }
  
  // Remove whitespace lines from non-meaningful part
  // Work backwards to avoid index shifting issues
  for (let i = lines.length - 1; i > lastMeaningfulIndex; i--) {
    if (lines[i].trim() === '') {
      lines.splice(i, 1);
    }
  }
  
  // Count fences in non-meaningful part (after lastMeaningfulIndex)
  let nonMeaningfulFences = 0;
  for (let i = lastMeaningfulIndex + 1; i < lines.length; i++) {
    if (lines[i].trim() === '```') {
      nonMeaningfulFences++;
    }
  }
  
    // Remove lines from end to balance fence counts
    let fencesToRemove = 0;
    if (nonMeaningfulFences > meaningfulFences) {
        // Too many fences at end, remove from the back
        fencesToRemove = nonMeaningfulFences - meaningfulFences;
    } else if (nonMeaningfulFences === meaningfulFences && meaningfulFences % 2 !== 0) {
        fencesToRemove = nonMeaningfulFences - 1;
    }
    if (fencesToRemove > 0) {
        for (let i = lines.length - 1; i > lastMeaningfulIndex && fencesToRemove > 0; i--) {
            if (lines[i].trim() === '```') {
                lines.splice(i, 1);
                fencesToRemove--;
            }
        }
    }
  
  return lines;
}
