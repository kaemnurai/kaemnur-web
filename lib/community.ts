// Community display helpers shared between the public page and stats API.

// There is no per-topic view counter in the schema, so we derive a stable
// "views" estimate from the topic id and its reply count. Deterministic so the
// same topic always shows the same number (server + client agree).
export function pseudoViews(id: string, comments: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 24 + (h % 460) + comments * 13;
}

// Per-category badge colors used across topic rows and the sub-forum list.
export const CATEGORY_STYLE: Record<string, { text: string; bg: string; icon: string }> = {
  General: { text: "text-info", bg: "bg-info/15", icon: "message-square" },
  Questions: { text: "text-[#A78BFA]", bg: "bg-[#A78BFA]/15", icon: "help-circle" },
  "Bug Reports": { text: "text-danger", bg: "bg-danger/15", icon: "alert-triangle" },
  Suggestions: { text: "text-success", bg: "bg-success/15", icon: "sparkles" },
};
