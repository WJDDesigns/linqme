/**
 * Returns true if the hex colour is perceptually "light" (luma > 0.5).
 * Accepts 3- or 6-digit hex with or without #.
 */
export function isLightColor(hex: string): boolean {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5;
}

/** Returns a contrasting text color (dark or white) for the given background. */
export function contrastText(bg: string): string {
  return isLightColor(bg) ? "#1a1c25" : "#ffffff";
}
