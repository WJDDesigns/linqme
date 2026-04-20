/** Sanitize a value for use in Supabase .or() filter strings.
 *  Removes characters that could manipulate filter syntax: commas, parentheses, backticks, and dots. */
export function sanitizeFilterValue(val: string): string {
  return val.replace(/[,()`.]/g, "").trim();
}
