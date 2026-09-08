import { PageHeader } from "@/components/PageHeader";
import { EmergencyDisclaimer } from "@/components/EmergencyDisclaimer";
import { BRAND } from "@maybe/config";

export default function TrustSafetyPage() {
  return (
    <>
      <PageHeader title="Trust and safety" />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 text-sm text-slate-700">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">How we verify plumbers</h2>
          <p className="mt-2">
            Before a plumber can appear in search or accept jobs, our team reviews their submitted plumbing licence
            (where applicable) and proof of commercial general liability insurance. We track expiry dates and
            automatically prevent a plumber from accepting new jobs if either document lapses, until it&apos;s
            renewed and re-verified.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Reviews you can trust</h2>
          <p className="mt-2">
            Only customers with a completed, eligible booking can leave a review for that job. We don&apos;t display
            fake reviews, inflated job counts, or unverified trust claims anywhere on {BRAND.name} — any
            demonstration content in this environment is clearly labelled as such.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">In-app communication</h2>
          <p className="mt-2">
            Messages related to your booking stay inside the app so there&apos;s a record if something needs to be
            resolved later. Personal phone numbers are not shared unless both sides consent.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Disputes and refunds</h2>
          <p className="mt-2">
            If something goes wrong, you can open a dispute with evidence (photos, messages, the estimate history).
            A trained administrator — never an automatic system — reviews the case and decides on a partial refund,
            full refund, or another resolution.
          </p>
        </section>
        <EmergencyDisclaimer />
      </div>
    </>
  );
}
