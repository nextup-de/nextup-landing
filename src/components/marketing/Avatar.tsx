// A person's initials on their tint, as in the app (same tone for the same name everywhere). Anonymous people get "?" in grey.
import { avatarTone, initials } from "@/lib/avatar";
import styles from "./Avatar.module.css";

export function Avatar({ name, size = 32, className }: { name: string; size?: 24 | 28 | 32 | 36; className?: string }) {
  return (
    <span className={className ? `${styles.avatar} ${className}` : styles.avatar} data-avatar={avatarTone(name)} data-size={size} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

// An avatar with a name and one line under it.
export function Person({ name, sub }: { name: string; sub?: string }) {
  return (
    <span className={styles.person}>
      <Avatar name={name} />
      <span className={styles.who}>
        <strong>{name}</strong>
        {sub && <small>{sub}</small>}
      </span>
    </span>
  );
}
