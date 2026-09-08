"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Dashboard {
  totalUsers: number;
  activeCustomers: number;
  pendingPlumberApplications: number;
  approvedPlumbers: number;
  onlinePlumbers: number;
  totalRequests: number;
  cancellationRatePercent: number;
  openDisputes: number;
  grossTransactionValueCents: number;
  platformRevenueCents: number;
  plumberPayoutsCents: number;
  paidInvoiceCount: number;
}

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<Dashboard>({
    queryKey: ["admin-dashboard"],
    queryFn: () => apiClient.get<Dashboard>("/admin/dashboard"),
    refetchInterval: 30_000,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      {isLoading || !data ? (
        <p className="mt-4 text-sm text-slate-500">Loading...</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <StatCard label="Total users" value={data.totalUsers} />
          <StatCard label="Active customers" value={data.activeCustomers} />
          <StatCard label="Pending applications" value={data.pendingPlumberApplications} />
          <StatCard label="Approved plumbers" value={data.approvedPlumbers} />
          <StatCard label="Online plumbers" value={data.onlinePlumbers} />
          <StatCard label="Service requests" value={data.totalRequests} />
          <StatCard label="Cancellation rate" value={`${data.cancellationRatePercent}%`} />
          <StatCard label="Open disputes" value={data.openDisputes} />
          <StatCard label="Gross transaction value" value={money(data.grossTransactionValueCents)} />
          <StatCard label="Platform revenue" value={money(data.platformRevenueCents)} />
          <StatCard label="Plumber payouts" value={money(data.plumberPayoutsCents)} />
          <StatCard label="Paid invoices" value={data.paidInvoiceCount} />
        </div>
      )}
    </div>
  );
}
