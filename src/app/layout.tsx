import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { SITE } from "@/config/site";
import "./globals.css";

// Fonts are committed in ./fonts (latin subset, SIL Open Font License) and served from this origin.
// No request ever goes to Google - not from a visitor's browser (GDPR, LG München I, 3 O 17493/20) and not from
// the build either: next/font/google downloads at build time, and a failed download breaks the image build.
const onest = localFont({ src: "./fonts/onest-var.woff2", weight: "400 700", variable: "--font-onest", display: "swap" }); // the site's own face
const inter = localFont({ src: "./fonts/inter-var.woff2", weight: "400 700", variable: "--font-inter", display: "swap" }); // the product's screens, as in the app
const mono = localFont({
  src: [
    { path: "./fonts/plex-mono-400.woff2", weight: "400" },
    { path: "./fonts/plex-mono-500.woff2", weight: "500" },
    { path: "./fonts/plex-mono-600.woff2", weight: "600" },
  ],
  variable: "--font-mono", display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${SITE.name} - ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  // Read by the Taste Skill's checkers (what kind of site this is): software, sold to manufacturing plants.
  other: { "page-type": "software", "site-kind": "software" },
};

// The phone's browser bar takes the colour of the site's top bar.
export const viewport: Viewport = { themeColor: "#00626e" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-type="software" className={`${onest.variable} ${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
