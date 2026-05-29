// Deterministic per-name avatar color — same name always gets same color.
const PALETTE = [
  "#F4B400", // amber
  "#4CAF50", // green
  "#2196F3", // blue
  "#E91E63", // pink
  "#9C27B0", // purple
  "#FF5722", // deep-orange
  "#00BCD4", // cyan
];

export function getAvatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}

/** Returns a contrasting text color (black or white) for a given bg hex. */
export function getAvatarTextColor(bg: string): string {
  // Parse hex to RGB
  const hex = bg.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  // Relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#0F1419" : "#FFFFFF";
}

export function getInitial(name: string): string {
  return name.trim()[0]?.toUpperCase() ?? "?";
}
