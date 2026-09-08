"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface ServiceRequestRow {
  id: string;
  contactName: string;
  status: string;
  urgency: string;
  postalCode: string;
  createdAt: string;
  category: { name: string };
  assignedPlumberProfile: { user: { fullName: string } } | null;
}

const STATUS_FILTERS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "plumber_assigned", label: "Plumber assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "no_plumber_available", label: "No plumber available" },
];

export default function AdminRequestsPage() {
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery<{ items: ServiceRequestRow[]; total: number }>({
    queryKey: ["admin-requests", status],
    queryFn: () => apiClient.get(`/service-requests?pageSize=50${status ? `&status=${status}` : ""}`),
    refetchInterval: 20_000,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Service requests</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              status === f.value ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Urgency</th>
              <th className="px-4 py-2">Postal</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Plumber</th>
              <th className="px-4 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td className="px-4 py-4 text-slate-500" colSpan={7}>Loading...</td></tr>
            )}
            {data?.items.length === 0 && (
              <tr><td className="px-4 py-4 text-slate-500" colSpan={7}>No requests match this filter.</td></tr>
            )}
            {data?.items.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <Link href={`/admin/requests/${r.id}`} className="font-medium text-brand-700 underline">
                    {r.contactName}
                  </Link>
                </td>
                <td className="px-4 py-2">{r.category.name}</td>
                <td className="px-4 py-2 capitalize">{r.urgency.toLowerCase()}</td>
                <td className="px-4 py-2">{r.postalCode}</td>
                <td className="px-4 py-2">{r.status.replace(/_/g, " ")}</td>
                <td className="px-4 py-2">{r.assignedPlumberProfile?.user.fullName ?? "—"}</td>
                <td className="px-4 py-2">{new Date(r.createdAt).toLocaleString("en-CA")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
