"use client";
// The footer. On the home page it is the last screen: the close (the main action, and the raise box for the
// visitor's own decision) above the links. Every other page gets the links alone.
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseAsk } from "@/components/marketing/CloseAsk";
import { LOGIN_URL, SITE } from "@/config/site";
import { cn } from "@/lib/utils/cn";
import styles from "./SiteFooter.module.css";

const COLUMNS: Array<[string, Array<[string, string]>]> = [
  ["Product", [["Ideas", "/#ideas"], ["Product tour", "/#product"], ["Rules", "/#rules"]]],
  ["Pilot", [["How a pilot runs", "/#pilot"], ["Pricing", "/pricing"], ["Questions", "/#questions"]]],
  ["Company", [["Book a pilot", "/contact"], ["Log in", LOGIN_URL]]],
  ["Legal", [["Imprint", "/imprint"], ["Privacy", "/privacy"]]],
];

export function SiteFooter() {
  const home = usePathname() === "/";
  return (
    <footer className={cn("footer", home && "closing", styles.footer)} aria-labelledby={home ? "close-h" : undefined}>
      <div className="wrap">
        {home && (
          <div className={cn("closing__cta", styles.close)}>
            <div className="section-head">
              <h2 id="close-h">Book a pilot for your plant</h2>
              <p>Name the decision that keeps waiting. Scope and price are agreed before any work starts.</p>
            </div>
            <CloseAsk />
          </div>
        )}
        <div className={styles.links}>
          <div className={styles.cols}>
            <div className={styles.brand}>
              <Link href="/" aria-label={`${SITE.name} home`}>
                <Image src="/brand/nextup-logo-blue.png" alt={SITE.name} width={494} height={212} />
              </Link>
              <p>Idea management for manufacturing plants. Hosted in Nuremberg, Germany.</p>
            </div>
            {COLUMNS.map(([title, links]) => (
              <nav key={title} className={styles.col} aria-label={title}>
                <h4>{title}</h4>
                <ul>{links.map(([label, href]) => <li key={label}><Link className="nh-link" href={href}>{label}</Link></li>)}</ul>
              </nav>
            ))}
          </div>
          <p className={styles.legal}>
            <span>&copy; 2026 {SITE.name}</span>
            <span>No cookies. No tracking.</span>
            <span>Product screens show a demo company.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
