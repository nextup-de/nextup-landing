// The tint behind a person's initials: one of five, picked by name so a person keeps theirs everywhere.
// Anonymous people and "nobody" get none (the grey fallback). A copy of the app's src/lib/avatar.ts; colours
// are [data-avatar] in globals.css.
const TONES = ["blue", "green", "amber", "violet", "teal"] as const;
export type AvatarTone = (typeof TONES)[number];

export function avatarTone(name: string): AvatarTone | undefined {
  const n = name.trim();
  if (!n || n === "—" || n === "?" || n.startsWith("Anonymous")) return undefined;
  return TONES[[...n].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % TONES.length];
}

// "T. Vogel" -> "TV", "Anonymous #2210" -> "?".
export function initials(name: string): string {
  if (!avatarTone(name)) return "?";
  return name.replace(/[^A-Za-zÀ-ž ]/g, " ").split(/\s+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}
