import Link from "next/link";
import { BRAND } from "@maybe/config";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/plumbers", label: "Browse plumbers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/become-a-plumber", label: "Become a plumber" },
];

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <span aria-hidden className="inline-block h-7 w-7 rounded bg-brand-600" />
          {BRAND.name}
        </Link>
        <nav aria-label="Main" className="hidden gap-6 text-sm font-medium text-slate-700 md:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brand-700">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/emergency"
            className="rounded-md bg-emergency-500 px-3 py-2 text-sm font-semibold text-white hover:bg-emergency-600"
          >
            Emergency help
          </Link>
          <Link href="/sign-in" className="text-sm font-medium text-slate-700 hover:text-brand-700">
            Sign in
          </Link>
          <Link
            href="/request"
            className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Book a plumber
          </Link>
        </div>
      </div>
    </header>
  );
}
