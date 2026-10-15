import type { Metadata } from "next";
import localFont from "next/font/local";
import { SITE } from "@/config/site";
import "./globals.css";

// Fonts are committed in ./fonts (latin subset, SIL Open Font License) and served from this origin.
// No request ever goes to Google - not from a visitor's browser (GDPR, LG München I, 3 O 17493/20) and not from
// the build either: next/font/google downloads at build time, and a failed download breaks the image build.
const sans = localFont({ src: "./fonts/manrope-var.woff2", weight: "400 800", variable: "--font-sans", display: "swap" });
const mono = localFont({
  src: [
    { path: "./fonts/plex-mono-400.woff2", weight: "400" },
    { path: "./fonts/plex-mono-500.woff2", weight: "500" },
    { path: "./fonts/plex-mono-600.woff2", weight: "600" },
  ],
  variable: "--font-mono", display: "swap",
});
const inter = localFont({ src: "./fonts/inter-var.woff2", weight: "400 700", variable: "--font-inter", display: "swap" }); // headings and the product's own screens, as in the app

export const metadata: Metadata = {
  title: { default: `${SITE.name} - ${SITE.tagline}`, template: `%s · ${SITE.name}` },
  description: SITE.description,
  // What a shared link shows in Slack, Teams, LinkedIn or a mail client. Text only: no image to keep in step.
  openGraph: { type: "website", siteName: SITE.name, title: `${SITE.name} - ${SITE.tagline}`, description: SITE.description },
  twitter: { card: "summary", title: `${SITE.name} - ${SITE.tagline}`, description: SITE.description },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
