// The kicker over the three beats of the turn (#owner, #clock, #seen): a short stretch of line with three stations,
// the beat's own station lit, and its words ("The turn · 2 of 3"). Static; the words are the text equivalent.
import { cn } from "@/lib/utils/cn";
import styles from "./Turn.module.css";

/**
 * at     which beat this is, 1 to 3
 * of     how many beats the turn has (3)
 * label  the words before the count, "The turn"
 * dark   on the night ground (#owner)
 */
export function Turn({ at, of = 3, label = "The turn", dark = false, className }: {
  at: number; of?: number; label?: string; dark?: boolean; className?: string;
}) {
  return (
    <p className={cn(styles.turn, className)} data-dark={dark || undefined}>
      <span className={styles.line} aria-hidden="true">
        {Array.from({ length: of }, (_, i) => <i key={i} data-on={i + 1 === at || undefined} data-past={i + 1 < at || undefined} />)}
      </span>
      <span>{label} · {at} of {of}</span>
    </p>
  );
}
