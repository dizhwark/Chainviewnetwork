import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { serverGet } from "@/lib/server-api";

export const dynamic = "force-dynamic";

interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  emergencyEligible: boolean;
  pricingMethod: string;
  estimatedRangeMinCents: number;
  estimatedRangeMaxCents: number;
  baseDiagnosticFeeCents: number;
}

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export default async function ServicesPage() {
  const categories = (await serverGet<ServiceCategory[]>("/service-categories")) ?? [];

  return (
    <>
      <PageHeader title="Plumbing services" subtitle="Every category shows a starting price range so you know roughly what to expect." />
      <div className="mx-auto max-w-5xl px-4 py-10">
        {categories.length === 0 ? (
          <p className="text-sm text-slate-500">Service categories will appear once the API is running.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {categories.map((c) => (
              <div key={c.id} className="rounded-lg border border-slate-200 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">{c.name}</h2>
                  {c.emergencyEligible && (
                    <span className="rounded-full bg-emergency-50 px-2 py-0.5 text-xs font-medium text-emergency-600">
                      Emergency eligible
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{c.description}</p>
                <p className="mt-3 text-sm font-medium text-brand-700">
                  Typical range: {money(c.estimatedRangeMinCents)}–{money(c.estimatedRangeMaxCents)}
                  {c.baseDiagnosticFeeCents > 0 && ` (plus ${money(c.baseDiagnosticFeeCents)} diagnostic fee if inspection is needed)`}
                </p>
                <Link href={`/request?category=${c.slug}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 underline">
                  Request this service
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
