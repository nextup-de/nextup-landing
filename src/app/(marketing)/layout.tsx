// Public site chrome: header + footer, no auth.
import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { Ground } from "@/components/shell/Ground";
import styles from "./layout.module.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.site}>
      <a className="nh-skip" href="#main">Skip to content</a>
      <Ground />
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </div>
  );
}
