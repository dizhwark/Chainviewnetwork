import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { serverGet } from "@/lib/server-api";

export const dynamic = "force-dynamic";

interface PublicPlumber {
  id: string;
  name: string;
  businessName?: string;
  biography?: string;
  yearsExperience: number;
  averageRating: number;
  reviewCount: number;
  categories: string[];
  verified: boolean;
}

export default async function BrowsePlumbersPage() {
  const result = await serverGet<{ items: PublicPlumber[] }>("/plumbers?pageSize=50");
  const plumbers = result?.items ?? [];

  return (
    <>
      <PageHeader title="Browse verified plumbers" subtitle="Every profile shown here has an approved licence and insurance on file." />
      <div className="mx-auto max-w-5xl px-4 py-10">
        {plumbers.length === 0 ? (
          <p className="text-sm text-slate-500">No approved plumbers yet. Check back soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {plumbers.map((p) => (
              <Link key={p.id} href={`/plumbers/${p.id}`} className="rounded-lg border border-slate-200 p-5 hover:border-brand-400">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">{p.businessName ?? p.name}</h2>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">Verified</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{p.yearsExperience} years of experience</p>
                <p className="mt-1 text-sm text-slate-600">{p.categories.join(", ")}</p>
                <p className="mt-2 text-sm text-brand-700">
                  {p.reviewCount > 0 ? `${p.averageRating.toFixed(1)} ★ (${p.reviewCount} reviews)` : "New on the platform"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
