import { PageHeader } from "@/components/PageHeader";
import { BRAND } from "@maybe/config";

const FAQS = [
  { q: "What areas do you serve?", a: "We're launching in select Downtown Toronto postal codes, with more areas planned. Use the coverage check on the homepage to see if we serve your address." },
  { q: "How is pricing determined?", a: "Some jobs have a fixed price, others need an in-person diagnosis first. Either way, you always see known fees and an estimated range before booking, and must approve a written estimate before non-emergency work begins." },
  { q: "How are plumbers verified?", a: "We review each plumber's licence (where applicable) and proof of insurance before they can appear in search or accept jobs. See our Trust & Safety page for details." },
  { q: "Can I choose my own plumber?", a: "Yes — you can browse verified plumber profiles and request a specific one, or let us match you automatically with an available, qualified plumber nearby." },
  { q: "What if no plumber is available?", a: "If we can't find an eligible plumber, we'll tell you right away and offer to schedule for later or connect you with our support team." },
  { q: "How do refunds work?", a: `${BRAND.name} does not offer an automatic refund button. You can report a problem with evidence, and a trained administrator reviews the case before deciding on a refund.` },
  { q: "Is my payment information secure?", a: "Payments are processed through Stripe, a PCI-compliant payment processor. We never store your card number or CVV." },
];

export default function FaqPage() {
  return (
    <>
      <PageHeader title="Frequently asked questions" />
      <div className="mx-auto max-w-3xl divide-y divide-slate-200 px-4 py-10">
        {FAQS.map((item) => (
          <details key={item.q} className="group py-4">
            <summary className="cursor-pointer list-none font-semibold text-slate-900 focus-ring">{item.q}</summary>
            <p className="mt-2 text-sm text-slate-600">{item.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
