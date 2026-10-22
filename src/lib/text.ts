/** Lowercases only the first letter, so names like "HR portal" keep their capitals mid-sentence. */
export const lowerFirst = (s: string): string => (s ? s[0].toLowerCase() + s.slice(1) : s);
