"use client";
// The site's top bar: the brand colour, as on the app. The pill in the middle marks the page you are on.
// On a phone the pill folds into a menu, closed until asked for.
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LOGIN_URL, SITE } from "@/config/site";
import styles from "./SiteHeader.module.css";

const LINKS = [
  { href: "/#product", label: "Product", on: (p: string) => p === "/product" },
  { href: "/#pilot", label: "Pilot", on: (p: string) => p === "/pilot" },
  { href: "/pricing", label: "Pricing", on: (p: string) => p.startsWith("/pricing") },
];

export function SiteHeader() {
  const path = usePathname() ?? "/";
  return (
    <header className={styles.bar}>
      <Link className={styles.logo} href="/" aria-label={`${SITE.name} home`}>
        <Image src="/brand/nextup-logo-white.png" alt={SITE.name} width={494} height={212} priority />
      </Link>
      <nav className={styles.pill} aria-label="Site">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} aria-current={l.on(path) ? "page" : undefined}>{l.label}</Link>
        ))}
      </nav>
      <div className={styles.actions}>
        <Button href={LOGIN_URL} variant="onbrand" size="sm" className={styles.login}>Log in</Button>
        <Button href="/contact" variant="white" size="sm">Book a pilot</Button>
        <details className={styles.menu}>
          <summary aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </summary>
          <nav className={styles.sheet} aria-label="Site, on a phone">
            {LINKS.map((l) => <Link key={l.href} href={l.href}>{l.label}</Link>)}
            <a href={LOGIN_URL}>Log in</a>
          </nav>
        </details>
      </div>
    </header>
  );
}
