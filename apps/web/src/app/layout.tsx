import type { Metadata, Viewport } from "next";
import { BRAND } from "@maybe/config";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: `${BRAND.name} — Toronto Plumbers, On Demand`, template: `%s — ${BRAND.name}` },
  description: BRAND.tagline,
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#22705f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-CA">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-brand-700 focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
