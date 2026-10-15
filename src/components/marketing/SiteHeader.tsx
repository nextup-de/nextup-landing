"use client";
// The site header: sticky, see-through over the top of the page, a frosted bar once the page scrolls. On phones
// and small tablets the links fold into a menu under the bar.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/Button";
import { LOGIN_URL, SITE } from "@/config/site";
import styles from "./SiteHeader.module.css";

const LINKS = [
  ["/#product", "Product"],
  ["/#trust", "Security"],
  ["/#pilot", "Pilot"],
  ["/pricing", "Pricing"],
] as const;

function onScroll(cb: () => void) {
  window.addEventListener("scroll", cb, { passive: true });
  return () => window.removeEventListener("scroll", cb);
}

export function SiteHeader() {
  const scrolled = useSyncExternalStore(onScroll, () => window.scrollY > 8, () => false);
  const [open, setOpen] = useState(false);

  // Escape closes the menu.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className={styles.bar} data-solid={scrolled || open ? "true" : undefined}>
      <div className={styles.inner}>
        <Link className={styles.logo} href="/" aria-label={`${SITE.name} home`} onClick={() => setOpen(false)}>
          <Image src="/brand/nextup-logo-blue.png" alt={SITE.name} width={506} height={224} priority />
        </Link>
        <nav className={styles.links} aria-label="Site">
          {LINKS.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        </nav>
        <div className={styles.actions}>
          <Button href={LOGIN_URL} variant="ghost" size="sm" className={styles.login}>Log in</Button>
          <Button href="/contact" size="sm">Book a pilot</Button>
          <button
            type="button" className={styles.burger} aria-expanded={open} aria-controls="site-menu"
            aria-label={open ? "Close the menu" : "Open the menu"} onClick={() => setOpen((o) => !o)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M4 4l10 10M14 4L4 14" /> : <path d="M3 6h12M3 12h12" />}
            </svg>
          </button>
        </div>
      </div>
      <nav id="site-menu" className={styles.menu} data-open={open ? "true" : undefined} aria-label="Menu">
        {LINKS.map(([href, label]) => <Link key={href} href={href} onClick={() => setOpen(false)}>{label}</Link>)}
        <a href={LOGIN_URL} onClick={() => setOpen(false)}>Log in</a>
      </nav>
    </header>
  );
}
