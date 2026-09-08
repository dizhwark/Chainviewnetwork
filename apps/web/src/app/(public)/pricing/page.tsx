import { PageHeader } from "@/components/PageHeader";
import { PLATFORM_DEFAULTS, BRAND } from "@maybe/config";

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export default function PricingPage() {
  return (
    <>
      <PageHeader title="Pricing and fees" subtitle="What you pay for, and how it's calculated — no floating-point rounding surprises, ever." />
      <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">What&apos;s in your total</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li><strong>Labour and materials</strong> — either a fixed price, an hourly rate, or an itemized estimate after inspection, depending on the job.</li>
            <li><strong>Diagnostic / call-out fee</strong> — some categories require an in-person diagnosis before a firm price can be given; this is disclosed before booking.</li>
            <li><strong>Emergency / after-hours fee</strong> — currently {money(PLATFORM_DEFAULTS.emergencyFee.amountCents)} flat (or {PLATFORM_DEFAULTS.emergencyFee.percent}% depending on configuration), only for emergency or after-hours requests, and only when enabled — always shown before payment authorization.</li>
            <li><strong>HST</strong> — currently {PLATFORM_DEFAULTS.hstPercent}%, applied to the taxable subtotal per Ontario&apos;s HST rules.</li>
            <li><strong>Platform service fee</strong> — {PLATFORM_DEFAULTS.commissionPercent}% is retained by {BRAND.name} from the plumber&apos;s side; customers pay the price shown, with no separate line-item markup.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">A worked example</h2>
          <div className="mt-3 rounded-lg border border-slate-200 p-5 text-sm">
            <div className="flex justify-between"><span>Job subtotal</span><span>$200.00</span></div>
            <div className="flex justify-between text-slate-500"><span>Platform commission (paid by the plumber, {PLATFORM_DEFAULTS.commissionPercent}%)</span><span>$30.00</span></div>
            <div className="flex justify-between text-slate-500"><span>Plumber&apos;s payout before payment processing</span><span>$170.00</span></div>
            <div className="mt-2 flex justify-between border-t pt-2"><span>HST ({PLATFORM_DEFAULTS.hstPercent}%)</span><span>$26.00</span></div>
            <div className="mt-2 flex justify-between border-t pt-2 font-semibold"><span>Customer total</span><span>$226.00</span></div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900">Cancellation and payment authorization</h2>
          <p className="mt-2 text-sm text-slate-700">
            You&apos;ll always see any known fees, whether an in-person inspection is required, applicable taxes, and
            our cancellation terms before you authorize payment. Non-emergency work never begins without your
            explicit approval of a written estimate.
          </p>
        </section>
      </div>
    </>
  );
}
