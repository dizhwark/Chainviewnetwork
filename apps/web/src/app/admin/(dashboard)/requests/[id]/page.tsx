"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { DemoDataBadge } from "@/components/DemoDataBadge";

interface Note {
  id: string;
  note: string;
  authorUserId: string;
  createdAt: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  kind: string;
  quantity: string;
  unitPriceCents: number;
  totalCents: number;
}

interface Invoice {
  id: string;
  status: string;
  subtotalCents: number;
  emergencyFeeCents: number;
  hstCents: number;
  totalCents: number;
  commissionCents: number;
  plumberPayoutCents: number;
  lineItems: InvoiceLineItem[];
}

interface RequestDetail {
  id: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  addressLine1: string;
  city: string;
  postalCode: string;
  problemDescription: string;
  status: string;
  urgency: string;
  isDemoData: boolean;
  category: { name: string; slug: string };
  assignedPlumberProfile: { id: string; user: { fullName: string } } | null;
  notes: Note[];
  invoices: Invoice[];
  review: { overallRating: number; comment?: string } | null;
}

interface PlumberOption {
  id: string;
  name: string;
  businessName?: string;
}

function money(cents: number) {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

const STATUS_OPTIONS = ["new", "contacted", "plumber_assigned", "scheduled", "in_progress", "completed", "cancelled", "no_plumber_available"];

export default function AdminRequestDetailPage({ params }: { params: { id: string } }) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [selectedPlumberId, setSelectedPlumberId] = useState("");
  const [statusChoice, setStatusChoice] = useState("");
  const [lineItems, setLineItems] = useState([{ description: "", kind: "labour", quantity: 1, unitPriceCents: 0 }]);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: request, isLoading } = useQuery<RequestDetail>({
    queryKey: ["admin-request", params.id],
    queryFn: () => apiClient.get<RequestDetail>(`/service-requests/${params.id}`),
  });

  const { data: plumbers } = useQuery<{ items: PlumberOption[] }>({
    queryKey: ["admin-plumbers", request?.category.slug],
    queryFn: () => apiClient.get(`/plumbers?category=${request?.category.slug}&pageSize=50`),
    enabled: !!request,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-request", params.id] });
    queryClient.invalidateQueries({ queryKey: ["admin-requests"] });
  }

  const assignMutation = useMutation({
    mutationFn: () =>
      apiClient.post(`/service-requests/${params.id}/status`, {
        status: "plumber_assigned",
        assignedPlumberProfileId: selectedPlumberId,
        note: note || undefined,
      }),
    onSuccess: () => {
      setNote("");
      invalidate();
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.apiError.message : "Failed to assign plumber"),
  });

  const statusMutation = useMutation({
    mutationFn: () => apiClient.post(`/service-requests/${params.id}/status`, { status: statusChoice, note: note || undefined }),
    onSuccess: () => {
      setNote("");
      invalidate();
    },
    onError: (err) => setActionError(err instanceof ApiClientError ? err.apiError.message : "Failed to update status"),
  });

  const noteMutation = useMutation({
    mutationFn: () => apiClient.post(`/service-requests/${params.id}/notes`, { note }),
    onSuccess: () => {
      setNote("");
      invalidate();
    },
  });

  const invoiceMutation = useMutation({
    mutationFn: () =>
      apiClient.post("/invoices", {
        serviceRequestId: params.id,
        isEmergency: request?.urgency === "EMERGENCY",
        lineItems: lineItems.filter((li) => li.description && li.unitPriceCents > 0),
      }),
    onSuccess: () => invalidate(),
    onError: (err) => setActionError(err instanceof ApiClientError ? err.apiError.message : "Failed to create invoice"),
  });

  const paymentLinkMutation = useMutation({
    mutationFn: (invoiceId: string) => apiClient.post<{ url: string; mode: string }>(`/payments/invoices/${invoiceId}/payment-link`),
    onSuccess: (result) => {
      alert(`Payment link (${result.mode}): ${result.url}`);
      invalidate();
    },
  });

  const recordPaymentMutation = useMutation({
    mutationFn: (invoiceId: string) => apiClient.post(`/payments/invoices/${invoiceId}/record-mock-payment`),
    onSuccess: () => invalidate(),
    onError: (err) => setActionError(err instanceof ApiClientError ? err.apiError.message : "Failed to record payment"),
  });

  const refundMutation = useMutation({
    mutationFn: ({ invoiceId, type }: { invoiceId: string; type: "partial" | "full" }) => {
      const reason = prompt("Reason for this refund (shown in the audit log):");
      if (!reason) throw new Error("cancelled");
      const amountCents = type === "partial" ? Number(prompt("Refund amount in dollars:")) * 100 : undefined;
      return apiClient.post("/payments/refunds", { invoiceId, type, amountCents, reason });
    },
    onSuccess: () => invalidate(),
    onError: (err) => {
      if (err instanceof Error && err.message === "cancelled") return;
      setActionError(err instanceof ApiClientError ? err.apiError.message : "Failed to issue refund");
    },
  });

  if (isLoading || !request) return <p className="text-sm text-slate-500">Loading...</p>;

  const invoice = request.invoices[0];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold text-slate-900">{request.contactName}</h1>
        {request.isDemoData && <DemoDataBadge />}
      </div>
      <p className="text-sm text-slate-600">{request.category.name} · {request.urgency} · {request.status.replace(/_/g, " ")}</p>

      {actionError && (
        <p role="alert" className="mt-4 rounded-md bg-emergency-50 p-3 text-sm text-emergency-700">{actionError}</p>
      )}

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Details</h2>
        <dl className="mt-2 space-y-1 text-sm text-slate-700">
          <div><dt className="inline font-medium">Email: </dt><dd className="inline">{request.contactEmail}</dd></div>
          <div><dt className="inline font-medium">Phone: </dt><dd className="inline">{request.contactPhone}</dd></div>
          <div><dt className="inline font-medium">Address: </dt><dd className="inline">{request.addressLine1}, {request.city}, {request.postalCode}</dd></div>
          <div><dt className="inline font-medium">Problem: </dt><dd className="inline">{request.problemDescription}</dd></div>
        </dl>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Assign a plumber</h2>
        {request.assignedPlumberProfile ? (
          <p className="mt-2 text-sm text-slate-700">Currently assigned: <strong>{request.assignedPlumberProfile.user.fullName}</strong></p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">No plumber assigned yet.</p>
        )}
        <div className="mt-3 flex gap-2">
          <select value={selectedPlumberId} onChange={(e) => setSelectedPlumberId(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring">
            <option value="">Select an eligible plumber</option>
            {plumbers?.items.map((p) => (
              <option key={p.id} value={p.id}>{p.businessName ?? p.name}</option>
            ))}
          </select>
          <button
            disabled={!selectedPlumberId || assignMutation.isPending}
            onClick={() => {
              if (confirm(`Assign ${plumbers?.items.find((p) => p.id === selectedPlumberId)?.name} to this request?`)) {
                assignMutation.mutate();
              }
            }}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Update status</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <select value={statusChoice} onChange={(e) => setStatusChoice(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring">
            <option value="">Select status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
          <input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus-ring"
          />
          <button
            disabled={!statusChoice || statusMutation.isPending}
            onClick={() => statusMutation.mutate()}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            Update
          </button>
          <button
            disabled={!note || noteMutation.isPending}
            onClick={() => noteMutation.mutate()}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Add note only
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-xs text-slate-500">
          {request.notes.map((n) => (
            <li key={n.id}>{new Date(n.createdAt).toLocaleString("en-CA")} — {n.note}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Invoice</h2>
        {invoice ? (
          <div className="mt-3 text-sm">
            <p className="font-medium">Status: {invoice.status}</p>
            <ul className="mt-2 space-y-1 text-slate-700">
              {invoice.lineItems.map((li) => (
                <li key={li.id} className="flex justify-between">
                  <span>{li.description} × {li.quantity}</span>
                  <span>{money(li.totalCents)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 space-y-1 border-t pt-2 text-slate-700">
              <div className="flex justify-between"><span>Emergency fee</span><span>{money(invoice.emergencyFeeCents)}</span></div>
              <div className="flex justify-between"><span>HST</span><span>{money(invoice.hstCents)}</span></div>
              <div className="flex justify-between font-semibold"><span>Total</span><span>{money(invoice.totalCents)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Platform commission</span><span>{money(invoice.commissionCents)}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Plumber payout</span><span>{money(invoice.plumberPayoutCents)}</span></div>
            </div>
            {invoice.status !== "PAID" && invoice.status !== "REFUNDED" && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => paymentLinkMutation.mutate(invoice.id)} className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
                  Send payment link
                </button>
                <button onClick={() => recordPaymentMutation.mutate(invoice.id)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Record payment (manual/dev)
                </button>
              </div>
            )}
            {(invoice.status === "PAID" || invoice.status === "PARTIALLY_REFUNDED") && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => refundMutation.mutate({ invoiceId: invoice.id, type: "partial" })} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Issue partial refund
                </button>
                <button onClick={() => refundMutation.mutate({ invoiceId: invoice.id, type: "full" })} className="rounded-md border border-emergency-500 px-4 py-2 text-sm font-semibold text-emergency-600 hover:bg-emergency-50">
                  Issue full refund
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-3">
            <p className="text-sm text-slate-500">No invoice yet. Add line items to create one.</p>
            {lineItems.map((li, i) => (
              <div key={i} className="mt-2 flex gap-2">
                <input
                  placeholder="Description"
                  value={li.description}
                  onChange={(e) => setLineItems((items) => items.map((it, idx) => (idx === i ? { ...it, description: e.target.value } : it)))}
                  className="flex-1 rounded-md border border-slate-300 px-2 py-1 text-sm focus-ring"
                />
                <select
                  value={li.kind}
                  onChange={(e) => setLineItems((items) => items.map((it, idx) => (idx === i ? { ...it, kind: e.target.value } : it)))}
                  className="rounded-md border border-slate-300 px-2 py-1 text-sm focus-ring"
                >
                  <option value="labour">Labour</option>
                  <option value="materials">Materials</option>
                  <option value="fee">Fee</option>
                </select>
                <input
                  type="number"
                  min={0}
                  placeholder="$"
                  onChange={(e) =>
                    setLineItems((items) => items.map((it, idx) => (idx === i ? { ...it, unitPriceCents: Math.round(Number(e.target.value) * 100) } : it)))
                  }
                  className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm focus-ring"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setLineItems((items) => [...items, { description: "", kind: "labour", quantity: 1, unitPriceCents: 0 }])}
              className="mt-2 text-xs text-brand-700 underline"
            >
              + Add line item
            </button>
            <button
              onClick={() => invoiceMutation.mutate()}
              disabled={invoiceMutation.isPending || !request.assignedPlumberProfile}
              className="mt-4 block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Create invoice
            </button>
            {!request.assignedPlumberProfile && <p className="mt-1 text-xs text-slate-500">Assign a plumber before creating an invoice.</p>}
          </div>
        )}
      </section>

      {request.review && (
        <section className="mt-6 rounded-lg border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-900">Customer review</h2>
          <p className="mt-2 text-sm">{request.review.overallRating} ★ — {request.review.comment}</p>
        </section>
      )}
    </div>
  );
}
