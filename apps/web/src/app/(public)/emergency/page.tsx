import Link from "next/link";
import { EmergencyDisclaimer } from "@/components/EmergencyDisclaimer";
import { BRAND } from "@maybe/config";

export default function EmergencyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-emergency-700">Emergency plumbing</h1>
      <p className="mt-3 text-slate-700">
        Burst pipe, active flooding, sewage backup, or no heat in winter from a failed system — we prioritize
        emergency requests and match you with the nearest available, emergency-eligible plumber.
      </p>

      <div className="mt-6">
        <EmergencyDisclaimer />
      </div>

      <div className="mt-8 rounded-lg border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900">What counts as a plumbing emergency?</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>Burst or actively leaking pipe causing water damage</li>
          <li>Sewage backup or overflowing toilet that can&apos;t be shut off</li>
          <li>No water or a failed water heater in freezing conditions</li>
          <li>Flooding from a failed sump pump</li>
        </ul>
      </div>

      <div className="mt-6 rounded-lg bg-slate-50 p-5 text-sm text-slate-700">
        An emergency or after-hours request may include an additional fee. This is always shown clearly before you
        authorize payment — see our{" "}
        <Link href="/pricing" className="underline">
          pricing and fees
        </Link>{" "}
        page for details.
      </div>

      <Link
        href="/request?urgency=emergency"
        className="mt-8 inline-block rounded-md bg-emergency-500 px-6 py-3 font-semibold text-white hover:bg-emergency-600"
      >
        Request emergency help now
      </Link>
      <p className="mt-3 text-xs text-slate-500">{BRAND.name} is not a replacement for 911 or emergency utility services.</p>
    </div>
  );
}
