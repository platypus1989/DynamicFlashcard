/**
 * Utility functions for word operations
 */

/**
 * Normalizes a word for comparison (lowercase, trimmed)
 */
export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

/**
 * Deduplicates an array of words (case-insensitive)
 * Returns the original casing of the first occurrence of each word
 */
export function deduplicateWords(words: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const word of words) {
    const normalized = normalizeWord(word);
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(word);
    }
  }

  return result;
}

/**
 * Finds new words that don't exist in the current word list (case-insensitive)
 * @param newWords - Array of potentially new words to add
 * @param existingWords - Array of currently existing words
 * @returns Array of truly new words (with original casing preserved)
 */
export function findNewWords(newWords: string[], existingWords: string[]): string[] {
  const existingNormalized = new Set(existingWords.map(normalizeWord));
  
  return newWords.filter(word => {
    const normalized = normalizeWord(word);
    return normalized && !existingNormalized.has(normalized);
  });
}

/**
 * Finds words to remove from existing list based on updated word list (case-insensitive)
 * @param existingWords - Array of currently existing words
 * @param updatedWords - Array of words in the updated list
 * @returns Array of words that should be removed
 */
export function findWordsToRemove(existingWords: string[], updatedWords: string[]): string[] {
  const updatedNormalized = new Set(updatedWords.map(normalizeWord));
  
  return existingWords.filter(word => {
    const normalized = normalizeWord(word);
    return !updatedNormalized.has(normalized);
  });
}

/**
 * Parses a string of words separated by commas or newlines
 * @param input - String containing words
 * @returns Array of trimmed, non-empty words
 */
export function parseWordInput(input: string): string[] {
  return input
    .split(/[,\n]+/)
    .map(word => word.trim())
    .filter(word => word.length > 0);
}

