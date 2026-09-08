import { serverGet } from "@/lib/server-api";

interface StatusResult {
  status: string;
  category: string;
  urgency: string;
  createdAt: string;
  assignedPlumber: { name: string } | null;
  reviewUrl: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: "Received — we're reviewing your request",
  CONTACTED: "We've been in touch to confirm details",
  PLUMBER_ASSIGNED: "A plumber has been assigned",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "Work is in progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_PLUMBER_AVAILABLE: "No plumber available right now",
};

export default async function StatusPage({ params }: { params: { token: string } }) {
  const result = await serverGet<StatusResult>(`/service-requests/status/${params.token}`);

  if (!result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Request not found</h1>
        <p className="mt-3 text-slate-600">This status link may have expired or been mistyped.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Your request status</h1>
      <div className="mt-6 rounded-lg border border-slate-200 p-5">
        <p className="text-lg font-semibold text-brand-700">{STATUS_LABELS[result.status] ?? result.status}</p>
        <dl className="mt-4 space-y-2 text-sm text-slate-700">
          <div className="flex justify-between"><dt>Category</dt><dd>{result.category}</dd></div>
          <div className="flex justify-between"><dt>Urgency</dt><dd className="capitalize">{result.urgency.toLowerCase()}</dd></div>
          <div className="flex justify-between"><dt>Submitted</dt><dd>{new Date(result.createdAt).toLocaleString("en-CA")}</dd></div>
          {result.assignedPlumber && (
            <div className="flex justify-between"><dt>Plumber</dt><dd>{result.assignedPlumber.name}</dd></div>
          )}
        </dl>
      </div>
      {result.reviewUrl && (
        <a href={result.reviewUrl} className="mt-6 inline-block rounded-md bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700">
          Leave a review
        </a>
      )}
    </div>
  );
}
