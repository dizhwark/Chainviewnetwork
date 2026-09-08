import Link from "next/link";
import { BRAND } from "@maybe/config";

const COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Customers",
    links: [
      { href: "/request", label: "Book a plumber" },
      { href: "/emergency", label: "Emergency plumbing" },
      { href: "/pricing", label: "Pricing and fees" },
      { href: "/trust-safety", label: "Trust and safety" },
    ],
  },
  {
    title: "Plumbers",
    links: [
      { href: "/become-a-plumber", label: "Become a plumber" },
      { href: "/apply", label: "Apply now" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact and support" },
      { href: "/accessibility", label: "Accessibility statement" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/cancellation-policy", label: "Cancellation policy" },
      { href: "/refund-dispute-policy", label: "Refund and dispute policy" },
      { href: "/provider-agreement", label: "Contractor agreement" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 sm:grid-cols-4">
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="text-sm font-semibold text-slate-900">{col.title}</h3>
            <ul className="mt-3 space-y-2">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-600 hover:text-brand-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8 text-xs text-slate-500">
        <p>
          &copy; {new Date().getFullYear()} {BRAND.name}. Serving the Greater Toronto Area. {BRAND.name} connects
          customers with independently owned and operated licensed plumbing businesses; {BRAND.name} is not itself a
          plumbing contractor.
        </p>
      </div>
    </footer>
  );
}
