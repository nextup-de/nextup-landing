"use client";
// The site's top bar: a rounded pane of dark glass floating over the page, the words left, the logo in the exact
// middle, Log in and the one main action right, a thin line along its foot that fills as the page is ridden.
// On the home page it starts as nothing but the logo and the main action over the scene; the pane forms once the
// reader scrolls. Scrolling down tucks it away, scrolling up (or focus inside it) brings it back.
// Below 860px the bar keeps the logo, Book a pilot and a menu button. The menu opens as a full screen under the
// bar: each page with a line on what is there, a glimpse of the ideas list, and Log in. While it is open the page
// under it neither scrolls nor takes focus; Escape, a link or a wider window closes it, and focus goes back to
// the button that opened it.
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { onFrame } from "@/components/berlin/motion";
import { Avatar } from "@/components/product/elements";
import { Button } from "@/components/ui/Button";
import { HOSTING_PLACE, LOGIN_URL, NAV, SITE } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import styles from "./SiteHeader.module.css";

const LINKS = NAV;
/** A link is the current page when the path starts with its `match`; an anchor on the home page never is. */
const on = (l: (typeof NAV)[number], path: string) => (l.match ? path.startsWith(l.match) : false);
const WIDE = "(min-width: 860px)";

export function SiteHeader() {
  const path = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLAnchorElement>(null);
  const bar = useRef<HTMLElement>(null);
  const isOpen = useRef(open);
  useEffect(() => { isOpen.current = open; }, [open]);
  const home = path === "/";

  // Where the page is: the intro over the home page's scene, tucked away while scrolling down, the ride's progress.
  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const root = document.documentElement;
    // It tucks away after 48px of scrolling down and comes back after 16px up, so a layout shift of a few pixels
    // never moves it.
    let last = window.scrollY, hidden = false, run = 0;
    const stop = onFrame(() => {
      const y = window.scrollY, vh = window.innerHeight, dy = y - last;
      last = y;
      run = Math.sign(dy) === Math.sign(run) ? run + dy : dy;
      if (y < 120) hidden = false; else if (run > 48) hidden = true; else if (run < -16) hidden = false;
      const intro = home && y < vh * 0.3;
      const max = root.scrollHeight - vh;
      const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      return () => {
        const tuck = hidden && !isOpen.current;
        el.dataset.intro = String(intro);
        el.dataset.hidden = String(tuck);
        el.style.setProperty("--p", p.toFixed(4));
        root.dataset.nav = tuck ? "hidden" : "shown";
      };
    });
    return () => { stop(); delete root.dataset.nav; };
  }, [home]);

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
    <header ref={bar} className={cn("nav nav--split", styles.bar)} data-open={open} data-intro={home} data-hidden="false">
      <div className={styles.frame}>
      <div className={styles.in}>
        <nav className={styles.links} aria-label="Site">
          {LINKS.map((l) => (
            <Link key={l.href} className={styles.link} href={l.href} aria-current={on(l, path) ? "page" : undefined}>{l.label}</Link>
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
      <span className={styles.ride} aria-hidden="true"><i /></span>
      </div>

      <div id="site-menu" className={styles.sheet} data-open={open} inert={!open}>
        <div className={cn("wrap", styles.sheetIn)}>
          <nav aria-label="Site, menu">
            <ul className={styles.rows}>
              {LINKS.map((l, i) => (
                <li key={l.href} style={{ "--i": i } as React.CSSProperties}>
                  <Link ref={i === 0 ? first : undefined} href={l.href} aria-current={on(l, path) ? "page" : undefined} onClick={() => setOpen(false)}>
                    <span><strong>{l.label}</strong><small>{l.line}</small></span>
                    <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h9M6.5 2.5 10 6l-3.5 3.5" /></svg>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <Link className={styles.glimpse} href="/product#ideas" onClick={() => setOpen(false)} style={{ "--i": LINKS.length } as React.CSSProperties}>
            <span className={styles.faces} aria-hidden="true">
              {["M. Hoffmann", "N. Demir", "K. Yilmaz"].map((n) => <Avatar key={n} name={n} size={28} />)}
            </span>
            <span><strong>Every idea, and whose desk it is on</strong><small>Open the ideas list of the demo company</small></span>
          </Link>

          <div className={styles.foot} style={{ "--i": LINKS.length + 1 } as React.CSSProperties}>
            <Button href={LOGIN_URL} variant="ghost" size="lg" block>Log in</Button>
            <p>No cookies. No tracking. Hosted in {HOSTING_PLACE}.</p>
          </div>
        </div>
      </div>
    </header>
  );
}
