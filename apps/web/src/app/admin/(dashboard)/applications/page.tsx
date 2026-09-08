"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface ApplicationRow {
  id: string;
  approvalStatus: string;
  createdAt: string;
  user: { fullName: string; email: string };
  business: { businessName: string } | null;
}

const STATUS_FILTERS = ["", "submitted", "under_review", "more_info_required", "approved", "rejected", "suspended"];

export default function AdminApplicationsPage() {
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<{ items: ApplicationRow[] }>({
    queryKey: ["admin-applications", status],
    queryFn: () => apiClient.get(`/plumber-applications?pageSize=50${status ? `&status=${status}` : ""}`),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Plumber applications</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              status === s ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-700"
            }`}
          >
            {s === "" ? "All" : s.replace(/_/g, " ")}
          </button>
        ))}
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Business</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="px-4 py-4 text-slate-500" colSpan={4}>Loading...</td></tr>}
            {data?.items.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/admin/applications/${a.id}`} className="font-medium text-brand-700 underline">
                    {a.user.fullName}
                  </Link>
                </td>
                <td className="px-4 py-2">{a.business?.businessName ?? "—"}</td>
                <td className="px-4 py-2">{a.approvalStatus.replace(/_/g, " ")}</td>
                <td className="px-4 py-2">{new Date(a.createdAt).toLocaleDateString("en-CA")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
