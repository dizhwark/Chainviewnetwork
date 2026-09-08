"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface AuditLogEntry {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  reason?: string;
  beforeJson?: unknown;
  afterJson?: unknown;
  createdAt: string;
  actor: { fullName: string; email: string } | null;
}

export default function AdminAuditLogPage() {
  const { data, isLoading } = useQuery<{ items: AuditLogEntry[] }>({
    queryKey: ["admin-audit-log"],
    queryFn: () => apiClient.get("/admin/audit-log?pageSize=100"),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Audit log</h1>
      <p className="mt-1 text-sm text-slate-600">
        Append-only record of sensitive administrative actions. Nothing here can be edited or deleted by an
        administrator.
      </p>
      <div className="mt-6 space-y-3">
        {isLoading && <p className="text-sm text-slate-500">Loading...</p>}
        {data?.items.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-slate-200 p-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-900">{entry.action}</p>
              <p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString("en-CA")}</p>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {entry.actor?.fullName ?? "System"} · {entry.targetType} {entry.targetId.slice(0, 8)}
            </p>
            {entry.reason && <p className="mt-2 text-slate-700">Reason: {entry.reason}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
