import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { BRAND, PLATFORM_DEFAULTS } from "@maybe/config";

export default function BecomeAPlumberPage() {
  return (
    <>
      <PageHeader
        title={`Grow your plumbing business with ${BRAND.name}`}
        subtitle="Stop paying for leads that go nowhere. Get matched to nearby jobs and get paid quickly."
      />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900">What you get</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>A public business profile customers can find and trust</li>
              <li>Job requests matched to your service area and categories</li>
              <li>Fast, predictable payouts once a job is paid</li>
              <li>Scheduling, estimates, and invoicing tools built in</li>
              <li>Customer reviews that build your reputation over time</li>
            </ul>
          </div>
          <div className="rounded-lg border border-slate-200 p-5">
            <h2 className="font-semibold text-slate-900">How commission works</h2>
            <p className="mt-2 text-sm text-slate-700">
              {BRAND.name} takes a commission on completed jobs only — never for a lead that doesn&apos;t convert.
              The current standard commission is <strong>{PLATFORM_DEFAULTS.commissionPercent}%</strong>, and new
              plumbers may qualify for a promotional founding-plumber rate for their first{" "}
              {PLATFORM_DEFAULTS.foundingPlumberWindowDays} days. See{" "}
              <Link href="/pricing" className="underline">
                pricing and fees
              </Link>{" "}
              for the full breakdown.
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-slate-50 p-5">
          <h2 className="font-semibold text-slate-900">What you&apos;ll need to apply</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Business details and the categories of plumbing work you offer</li>
            <li>A valid Ontario plumbing licence (where applicable) with proof of licence</li>
            <li>Proof of commercial general liability insurance</li>
            <li>Agreement to our verification process and contractor terms</li>
          </ul>
        </div>

        <Link href="/apply" className="mt-8 inline-block rounded-md bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Start your application
        </Link>
      </div>
    </>
  );
}
