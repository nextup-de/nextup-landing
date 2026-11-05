"use client";
// The site's top bar in the brand colour, as on the app: the words left, the logo in the exact middle, Log in and
// the one main action right. It stays on top at every scroll position.
// Below 860px the bar keeps the logo, Book a pilot and a menu button. The menu opens as a full screen under the
// bar: each page with a line on what is there, a glimpse of the ideas list, and Log in. While it is open the page
// under it neither scrolls nor takes focus; Escape, a link or a wider window closes it, and focus goes back to
// the button that opened it.
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/product/elements";
import { Button } from "@/components/ui/Button";
import { LOGIN_URL, SITE } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import styles from "./SiteHeader.module.css";

const LINKS = [
  { href: "/#product", label: "Product", line: "Five steps, from the first word to the measured result", on: () => false },
  { href: "/#pilot", label: "Pilot", line: "Three phases, built with your people", on: () => false },
  { href: "/pricing", label: "Pricing", line: "Per seat, after a paid pilot", on: (p: string) => p.startsWith("/pricing") },
];
const WIDE = "(min-width: 860px)";

export function SiteHeader() {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!open) return;
    const rest = Array.from(document.querySelectorAll<HTMLElement>("main, body footer"));
    const close = (refocus: boolean) => { setOpen(false); if (refocus) toggle.current?.focus(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(true); };
    const wide = window.matchMedia(WIDE);
    const onWide = () => { if (wide.matches) close(false); };
    document.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    document.documentElement.style.overflow = "hidden";
    rest.forEach((el) => el.setAttribute("inert", ""));
    first.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      document.documentElement.style.overflow = "";
      rest.forEach((el) => el.removeAttribute("inert"));
    };
  }, [open]);

  return (
    <header className={cn("nav nav--split", styles.bar)} data-open={open}>
      <div className={cn("wrap", styles.in)}>
        <nav className={styles.links} aria-label="Site">
          {LINKS.map((l) => (
            <Link key={l.href} className={styles.link} href={l.href} aria-current={l.on(path) ? "page" : undefined}>{l.label}</Link>
          ))}
        </nav>
        <Link className={cn("nav__logo", styles.logo)} href="/" aria-label={`${SITE.name} home`} onClick={() => setOpen(false)}>
          <Image src="/brand/nextup-logo-white.png" alt={SITE.name} width={494} height={212} priority />
        </Link>
        <div className={cn("nav__actions", styles.actions)}>
          <a className={cn(styles.link, styles.login)} href={LOGIN_URL}>Log in</a>
          <Button href="/contact" variant="white">Book a pilot</Button>
          <button ref={toggle} type="button" className={cn("nav__toggle", styles.toggle)} aria-expanded={open} aria-controls="site-menu"
            aria-label={open ? "Close the menu" : "Open the menu"} onClick={() => setOpen((o) => !o)}>
            <span aria-hidden="true" /><span aria-hidden="true" />
          </button>
        </div>
      </div>

      <div id="site-menu" className={styles.sheet} data-open={open} inert={!open}>
        <div className={cn("wrap", styles.sheetIn)}>
          <nav aria-label="Site, menu">
            <ul className={styles.rows}>
              {LINKS.map((l, i) => (
                <li key={l.href} style={{ "--i": i } as React.CSSProperties}>
                  <Link ref={i === 0 ? first : undefined} href={l.href} aria-current={l.on(path) ? "page" : undefined} onClick={() => setOpen(false)}>
                    <span><strong>{l.label}</strong><small>{l.line}</small></span>
                    <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h9M6.5 2.5 10 6l-3.5 3.5" /></svg>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link className={styles.glimpse} href="/#ideas" onClick={() => setOpen(false)} style={{ "--i": LINKS.length } as React.CSSProperties}>
            <span className={styles.faces} aria-hidden="true">
              {["M. Hoffmann", "N. Demir", "K. Yilmaz"].map((n) => <Avatar key={n} name={n} size={28} />)}
            </span>
            <span><strong>Every idea, and whose desk it is on</strong><small>Open the ideas list of the demo company</small></span>
          </Link>

          <div className={styles.foot} style={{ "--i": LINKS.length + 1 } as React.CSSProperties}>
            <Button href={LOGIN_URL} variant="ghost" size="lg" block>Log in</Button>
            <p>No cookies. No tracking. Hosted in Nuremberg, Germany.</p>
          </div>
        </div>
      </div>
    </header>
  );
}
