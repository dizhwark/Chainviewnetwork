"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";

interface License {
  id: string;
  licenseNumber: string;
  licenseType: string;
  issuingAuthority: string;
  expiresOn: string;
  documentMediaId: string;
  status: string;
}

interface Insurance {
  id: string;
  provider: string;
  policyNumber: string;
  coverageAmountCents: number;
  expiresOn: string;
  documentMediaId: string;
  status: string;
}

interface ApplicationDetail {
  id: string;
  approvalStatus: string;
  biography?: string;
  yearsExperience: number;
  user: { fullName: string; email: string; phone: string };
  business: { businessName: string; businessType: string; addressLine1: string; city: string; postalCode: string } | null;
  licenses: License[];
  insuranceDocuments: Insurance[];
  services: { category: { name: string } }[];
  verificationReviews: { decision: string; reason?: string; createdAt: string }[];
}

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

export default function AdminApplicationDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: app, isLoading } = useQuery<ApplicationDetail>({
    queryKey: ["admin-application", params.id],
    queryFn: () => apiClient.get<ApplicationDetail>(`/plumber-applications/${params.id}`),
  });

  const decide = useMutation({
    mutationFn: (decision: "approved" | "rejected" | "more_info_required") =>
      apiClient.post(`/plumber-applications/${params.id}/decision`, { decision, reason: reason || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-application", params.id] });
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
      setReason("");
    },
    onError: (err) => setError(err instanceof ApiClientError ? err.apiError.message : "Failed to record decision"),
  });

  if (isLoading || !app) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">{app.user.fullName}</h1>
      <p className="text-sm text-slate-600">{app.business?.businessName} · {app.approvalStatus.replace(/_/g, " ")}</p>

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Applicant details</h2>
        <dl className="mt-2 space-y-1 text-sm text-slate-700">
          <div><dt className="inline font-medium">Email: </dt><dd className="inline">{app.user.email}</dd></div>
          <div><dt className="inline font-medium">Phone: </dt><dd className="inline">{app.user.phone}</dd></div>
          <div><dt className="inline font-medium">Business address: </dt><dd className="inline">{app.business?.addressLine1}, {app.business?.city}, {app.business?.postalCode}</dd></div>
          <div><dt className="inline font-medium">Years of experience: </dt><dd className="inline">{app.yearsExperience}</dd></div>
          <div><dt className="inline font-medium">Categories: </dt><dd className="inline">{app.services.map((s) => s.category.name).join(", ")}</dd></div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Licence</h2>
        {app.licenses.map((l) => (
          <div key={l.id} className="mt-2 text-sm text-slate-700">
            <p>{l.licenseType} — {l.licenseNumber} ({l.issuingAuthority})</p>
            <p className="text-xs text-slate-500">Expires {new Date(l.expiresOn).toLocaleDateString("en-CA")} · Document ref: {l.documentMediaId}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Insurance</h2>
        {app.insuranceDocuments.map((i) => (
          <div key={i.id} className="mt-2 text-sm text-slate-700">
            <p>{i.provider} — Policy {i.policyNumber} — {money(i.coverageAmountCents)} coverage</p>
            <p className="text-xs text-slate-500">Expires {new Date(i.expiresOn).toLocaleDateString("en-CA")} · Document ref: {i.documentMediaId}</p>
          </div>
        ))}
      </section>

      {error && <p role="alert" className="mt-4 rounded-md bg-emergency-50 p-3 text-sm text-emergency-700">{error}</p>}

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Decision</h2>
        <textarea
          placeholder="Reason (required for rejection or more-info requests)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring"
          rows={3}
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => confirm("Approve this plumber?") && decide.mutate("approved")}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Approve
          </button>
          <button
            onClick={() => decide.mutate("more_info_required")}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Request more info
          </button>
          <button
            onClick={() => confirm("Reject this application?") && decide.mutate("rejected")}
            className="rounded-md border border-emergency-500 px-4 py-2 text-sm font-semibold text-emergency-600 hover:bg-emergency-50"
          >
            Reject
          </button>
        </div>
      </section>

      {app.verificationReviews.length > 0 && (
        <section className="mt-6 rounded-lg border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">Review history</h2>
          <ul className="mt-2 space-y-1 text-xs text-slate-500">
            {app.verificationReviews.map((r, i) => (
              <li key={i}>{new Date(r.createdAt).toLocaleString("en-CA")} — {r.decision}{r.reason ? `: ${r.reason}` : ""}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
