import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gallery | SKINTIFIC Visual Bank",
  description: "The team's shared visual library.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout shares this font across all routes. */}
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
  </head><body><a className="skip-link" href="#main">Skip to content</a>{children}</body></html>;
}
