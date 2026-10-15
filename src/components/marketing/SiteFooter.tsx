import Image from "next/image";
import Link from "next/link";
import { LEGAL, LOGIN_URL, SITE } from "@/config/site";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <Image src="/brand/nextup-logo-blue.png" alt={SITE.name} width={506} height={224} />
          <p>{SITE.description}</p>
        </div>
        <nav className={styles.col} aria-label="Product">
          <p className={styles.colHead}>Product</p>
          <Link href="/#product">How it works</Link>
          <Link href="/#trust">Security</Link>
          <Link href="/#pilot">The pilot</Link>
          <Link href="/pricing">Pricing</Link>
        </nav>
        <nav className={styles.col} aria-label="Get started">
          <p className={styles.colHead}>Get started</p>
          <Link href="/contact">Book a pilot</Link>
          <a href={LOGIN_URL}>Log in</a>
        </nav>
        <nav className={styles.col} aria-label="Legal">
          <p className={styles.colHead}>Legal</p>
          <Link href="/imprint">Imprint</Link>
          <Link href="/privacy">Privacy</Link>
        </nav>
      </div>
      <div className={styles.bottom}>
        <p>
          {LEGAL.operator} · {LEGAL.org} · Berlin
        </p>
        <p className={`${styles.note} nh-mono`}>No cookies. No tracking. Fonts served from this site.</p>
      </div>
    </footer>
  );
}
