import Link from "next/link";
import { notFound } from "next/navigation";
import { serverGet } from "@/lib/server-api";
import { DemoDataBadge } from "@/components/DemoDataBadge";

export const dynamic = "force-dynamic";

interface Review {
  overallRating: number;
  comment?: string;
  createdAt: string;
  isVerifiedBooking: boolean;
  isDemoData: boolean;
  plumberResponse?: string;
}

interface PublicPlumber {
  id: string;
  name: string;
  businessName?: string;
  biography?: string;
  yearsExperience: number;
  averageRating: number;
  reviewCount: number;
  categories: string[];
  reviews: Review[];
  verified: boolean;
}

export default async function PlumberProfilePage({ params }: { params: { id: string } }) {
  const plumber = await serverGet<PublicPlumber>(`/plumbers/${params.id}`);
  if (!plumber) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">{plumber.businessName ?? plumber.name}</h1>
        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          Licence &amp; insurance verified
        </span>
      </div>
      <p className="mt-1 text-slate-600">{plumber.yearsExperience} years of experience</p>
      <p className="mt-3 text-sm text-brand-700">
        {plumber.reviewCount > 0 ? `${plumber.averageRating.toFixed(1)} ★ (${plumber.reviewCount} reviews)` : "New on the platform — no reviews yet"}
      </p>

      {plumber.biography && <p className="mt-4 text-slate-700">{plumber.biography}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {plumber.categories.map((c) => (
          <span key={c} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
            {c}
          </span>
        ))}
      </div>

      <Link
        href={`/request?plumberId=${plumber.id}`}
        className="mt-6 inline-block rounded-md bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700"
      >
        Request this plumber
      </Link>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Reviews</h2>
      {plumber.reviews.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">No reviews yet.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {plumber.reviews.map((r, i) => (
            <li key={i} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand-700">{r.overallRating} ★</span>
                {r.isVerifiedBooking && <span className="text-xs text-slate-500">Verified booking</span>}
                {r.isDemoData && <DemoDataBadge />}
              </div>
              {r.comment && <p className="mt-2 text-sm text-slate-700">{r.comment}</p>}
              {r.plumberResponse && (
                <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600">
                  <strong>Response from plumber:</strong> {r.plumberResponse}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
