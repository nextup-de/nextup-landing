"use client";
// The ground under every page: four soft blue blobs drifting under a grain and the app's dot grid, fixed behind the
// whole viewport. Came from the raise page (the NextUp mockup); the shells render it once so
// every page sits on the same surface. Purely decorative - nothing here is read by anyone.
// The home page paints its own grounds section by section, so it gets none (and nothing drifts unseen under it).
import { usePathname } from "next/navigation";
import styles from "./Ground.module.css";

export function Ground() {
  if (usePathname() === "/") return null;
  return (
    <div className={styles.ground} aria-hidden="true">
      <span className={styles.blob1} /><span className={styles.blob2} /><span className={styles.blob3} /><span className={styles.blob4} />
      <span className={styles.grain} /><span className={styles.dots} />
    </div>
  );
}
