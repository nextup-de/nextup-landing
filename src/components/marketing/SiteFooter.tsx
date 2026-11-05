import Link from "next/link";
import { LOGIN_URL, SITE } from "@/config/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <nav className={styles.links} aria-label="Footer">
        <Link href="/" className={styles.brand}>{SITE.name}</Link>
        <Link href="/#product">Product</Link>
        <Link href="/#pilot">Pilot</Link>
        <Link href="/pricing">Pricing</Link>
        <a href={LOGIN_URL}>Log in</a>
      </nav>
      <nav className={styles.links} aria-label="Legal">
        <span className={styles.note}>No cookies. No tracking.</span>
        <Link href="/imprint">Imprint</Link>
        <Link href="/privacy">Privacy</Link>
      </nav>
    </footer>
  );
}
