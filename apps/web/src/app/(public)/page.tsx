import Link from "next/link";
import { BRAND } from "@maybe/config";
import { CoverageCheckForm } from "@/components/CoverageCheckForm";
import { EmergencyDisclaimer } from "@/components/EmergencyDisclaimer";
import { serverGet } from "@/lib/server-api";

// Never statically freeze marketplace data at build time — categories and
// plumbers must reflect the live API, which may not even be reachable
// during a container build step.
export const dynamic = "force-dynamic";

interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  emergencyEligible: boolean;
}

interface PublicPlumber {
  id: string;
  name: string;
  businessName?: string;
  averageRating: number;
  reviewCount: number;
  categories: string[];
}

export default async function HomePage() {
  const categories = (await serverGet<ServiceCategory[]>("/service-categories")) ?? [];
  const plumbersResult = await serverGet<{ items: PublicPlumber[] }>("/plumbers?pageSize=3");
  const plumbers = plumbersResult?.items ?? [];

  return (
    <>
      <section className="bg-brand-900 text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold sm:text-5xl">Verified Toronto plumbers, transparent pricing.</h1>
            <p className="mt-4 text-lg text-brand-100">{BRAND.tagline}</p>
            <div className="mt-8 rounded-xl bg-white p-4 shadow-lg">
              <CoverageCheckForm />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/request"
                className="rounded-md bg-white px-5 py-3 font-semibold text-brand-800 hover:bg-brand-50"
              >
                Book a plumber
              </Link>
              <Link
                href="/emergency"
                className="rounded-md bg-emergency-500 px-5 py-3 font-semibold text-white hover:bg-emergency-600"
              >
                Emergency help
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <EmergencyDisclaimer />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900">How booking works</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Tell us the problem", body: "Describe the issue, share photos, and tell us how urgent it is." },
            { title: "We match you with a plumber", body: "A verified, licensed, insured plumber reviews your request." },
            { title: "Approve the estimate", body: "See itemized pricing before any non-emergency work begins." },
            { title: "Pay securely, leave a review", body: "Pay through the app once work is done, then rate your experience." },
          ].map((step, i) => (
            <li key={step.title} className="rounded-lg border border-slate-200 p-5">
              <span className="text-sm font-semibold text-brand-600">Step {i + 1}</span>
              <h3 className="mt-1 font-semibold text-slate-900">{step.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-slate-900">Popular plumbing categories</h2>
          {categories.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Categories will appear here once the API and database are running — see the setup guide in the README.
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.slice(0, 9).map((c) => (
                <Link
                  key={c.id}
                  href={`/request?category=${c.slug}`}
                  className="rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-400"
                >
                  <p className="font-semibold text-slate-900">
                    {c.name}
                    {c.emergencyEligible && (
                      <span className="ml-2 rounded-full bg-emergency-50 px-2 py-0.5 text-xs font-medium text-emergency-600">
                        Emergency eligible
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">{c.description}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900">Verified plumbers on {BRAND.name}</h2>
        <p className="mt-2 text-sm text-slate-600">
          Every plumber shown here has an approved licence and insurance on file, reviewed by our team.
        </p>
        {plumbers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No approved plumbers yet — check back soon, or run the seed script for demo profiles.</p>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {plumbers.map((p) => (
              <Link key={p.id} href={`/plumbers/${p.id}`} className="rounded-lg border border-slate-200 p-4 hover:border-brand-400">
                <p className="font-semibold text-slate-900">{p.businessName ?? p.name}</p>
                <p className="text-sm text-slate-600">{p.categories.slice(0, 3).join(", ")}</p>
                <p className="mt-2 text-sm text-brand-700">
                  {p.reviewCount > 0 ? `${p.averageRating.toFixed(1)} ★ (${p.reviewCount} reviews)` : "New on the platform"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-slate-50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-slate-900">Transparent pricing, no surprises</h2>
          <p className="mt-2 max-w-3xl text-slate-600">
            Every category shows a starting price or price range up front. If a job needs an in-person diagnosis, your
            plumber gives you an itemized estimate to approve before non-emergency work begins — labour, materials,
            taxes, and any emergency or after-hours fee are all shown separately. See the full breakdown on our{" "}
            <Link href="/pricing" className="underline">
              pricing and fees
            </Link>{" "}
            page.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold text-slate-900">Are you a plumber?</h2>
        <p className="mt-2 max-w-3xl text-slate-600">
          Stop paying for leads that go nowhere. Build a public profile, get matched to nearby jobs, and get paid
          quickly — with no cost to join.
        </p>
        <Link href="/become-a-plumber" className="mt-4 inline-block rounded-md bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700">
          Learn about joining {BRAND.name}
        </Link>
      </section>
    </>
  );
}
