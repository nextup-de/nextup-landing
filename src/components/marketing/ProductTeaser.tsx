"use client";
// #product on the landing: the interchange to the software. The head and the page's strongest link on the left;
// on the right one cropped, static window of the raise screen on the lit frame: the composer holding the story's
// request (REQUEST, features/demo/showcase) and the row it is routed to (EXAMPLES[0], features/tower/story, which
// ran the product's own matcher), so it matches the live box on /product#try. The whole window links there.
// Motion: the window pulls in once like a train at a platform (translateX 12% and opacity, 700 ms) when the
// figure is 30% in view; hover lifts it 4px. Reduced motion or no script: it simply stands there.
// Below 760px: the window goes full width under the text, and the buttons stack.
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/components/berlin/motion";
import { ArrowUp, Avatar, Clock, Pill } from "@/components/product/elements";
import { Arrow, Button } from "@/components/ui/Button";
import { SITE } from "@/config/site";
import { REQUEST } from "@/features/demo/showcase";
import { EXAMPLES } from "@/features/tower/story";
import styles from "./ProductTeaser.module.css";

const EX = EXAMPLES[0];

export function ProductTeaser() {
  const fig = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = fig.current;
    if (!el || reduced) return;
    el.dataset.armed = "";
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.in = ""; io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(el);
    return () => { io.disconnect(); delete el.dataset.armed; delete el.dataset.in; };
  }, [reduced]);

  return (
    <section className="section" id="product" data-ground="alt" aria-labelledby="product-h">
      <div className="wrap">
        <div className={styles.grid}>
          <div className={styles.text}>
            <p className={styles.kicker}><span className={styles.change} aria-hidden="true"><i /><i /></span>Change here · Product</p>
            <h2 id="product-h" className={styles.title}>That was the idea. This is the software.</h2>
            <p className={styles.lead}>
              The raise box, the ideas list and the five steps from the first word to the measured result, live with a
              fictional company. Nothing you type leaves your browser.
            </p>
            <div className={styles.actions}>
              <Button href="/product" size="lg">See the product<Arrow /></Button>
              <Link href="/product#try" className={styles.ghost}>
                <span className="nh-link">Try the raise box</span>
                <svg className="nh-arrow" viewBox="0 0 12 12" aria-hidden="true"><path d="M1 6h8" /><path d="M4.5 2.5 8 6l-3.5 3.5" /></svg>
              </Link>
            </div>
          </div>

          <div ref={fig} className={styles.platform}>
            <div className={`nh-lit ${styles.frame}`}>
              <Link href="/product#try" className={styles.window} aria-label="Open the raise box on the product page">
                <span className={styles.bar} aria-hidden="true">
                  <Image src="/brand/nextup-logo-white.png" alt="" width={494} height={212} />
                  <span className={styles.tabs}>{["Ideas", "Inbox", "Feed", "Projects"].map((t) => <span key={t} data-on={t === "Ideas" || undefined}>{t}</span>)}</span>
                  <span className={styles.me}>NS</span>
                </span>
                <span className={styles.body} aria-hidden="true">
                  <span className={styles.hello}>What is stuck, night shift?</span>
                  <span className={styles.box}>
                    <span className={styles.input}>{REQUEST}</span>
                    <span className={styles.send}><ArrowUp /></span>
                  </span>
                  {EX && (
                    <span className={styles.routed}>
                      <span className={styles.kind}>{EX.type}</span>
                      <span className={styles.rowLine}>
                        <Avatar name={EX.owner.name} size={34} />
                        <span className={styles.who}><b>{EX.owner.name}</b><small>{EX.owner.role}</small></span>
                        <Pill status="clock"><Clock size={11} />Due in {SITE.promiseDays} working days</Pill>
                      </span>
                      <span className={styles.dep}><Avatar name={EX.deputy.name} size={22} />Deputy · {EX.deputy.name}</span>
                    </span>
                  )}
                </span>
              </Link>
            </div>
            <div className={styles.edge} aria-hidden="true"><span>Platform · /product</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
