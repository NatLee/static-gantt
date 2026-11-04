/**
 * A task's predecessors are stored in `task.after` as a comma-separated id list ("p3b,p3c").
 * Saved projects use that format, so it stays; everything that reads or writes it goes through
 * these two helpers instead of splitting the string by hand.
 */

/** Predecessor ids in order, trimmed, without blanks or duplicates. */
export function parseAfter(after: string | undefined | null): string[] {
  if (!after) return [];
  const ids = after.split(',').map(s => s.trim()).filter(Boolean);
  return [...new Set(ids)];
}

/** The stored form of a predecessor list, or undefined when there is none. */
export function formatAfter(ids: readonly string[]): string | undefined {
  const unique = [...new Set(ids.map(s => s.trim()).filter(Boolean))];
  return unique.length > 0 ? unique.join(',') : undefined;
}
