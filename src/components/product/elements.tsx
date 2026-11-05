// The app's own small elements, drawn here with the app's values (apps/app components/ui/elements):
// a person is a round tinted face, a department a square tinted chip, a status a pill that always carries its word.
// The landing shows real product UI, so these must look exactly like the product.
import styles from "./elements.module.css";

export type Tone = "blue" | "green" | "amber" | "violet" | "teal" | "pink";
export type Status = "move" | "clock" | "info" | "late" | "ok" | "new";

export function initials(name: string) {
  const parts = name.replace(/[.,]/g, " ").split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

// The same name always gets the same tone, as in the app (lib/avatar.ts).
const TONES: Tone[] = ["blue", "green", "amber", "violet", "teal", "pink"];
export function toneOf(name: string): Tone {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

type AvatarProps = { name: string; tone?: Tone; size?: number; className?: string };
export function Avatar({ name, tone, size = 32, className }: AvatarProps) {
  return (
    <span className={`${styles.avatar} ${className ?? ""}`} data-tone={tone ?? toneOf(name)} aria-hidden="true"
      style={{ "--s": `${size}px` } as React.CSSProperties}>
      {initials(name)}
    </span>
  );
}

export function Dept({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return <span className={styles.dept} data-tone={tone}>{children}</span>;
}

export function Pill({ status, children }: { status: Status; children: React.ReactNode }) {
  return <span className={styles.pill} data-status={status}>{children}</span>;
}

// Done, in progress, blocked, open: the app's segmented progress bar. Parts are relative widths.
export function Progress({ parts, className }: { parts: Array<["done" | "doing" | "blocked" | "open", number]>; className?: string }) {
  return (
    <span className={`${styles.progress} ${className ?? ""}`} aria-hidden="true">
      {parts.map(([kind, grow], i) => <i key={i} data-part={kind} style={{ flexGrow: grow }} />)}
    </span>
  );
}

export function Clock({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
    </svg>
  );
}
export function Spark({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
    </svg>
  );
}
export function ArrowUp({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 19V5M6 11l6-6 6 6" />
    </svg>
  );
}
