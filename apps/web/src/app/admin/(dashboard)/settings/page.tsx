"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { PLATFORM_DEFAULTS } from "@maybe/config";

interface AppSetting {
  key: string;
  valueJson: unknown;
}

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: settings } = useQuery<AppSetting[]>({
    queryKey: ["admin-settings"],
    queryFn: () => apiClient.get("/app-settings"),
  });
  const { data: flags } = useQuery<FeatureFlag[]>({
    queryKey: ["admin-flags"],
    queryFn: () => apiClient.get("/feature-flags"),
  });

  const commissionPercent = (settings?.find((s) => s.key === "commissionPercent")?.valueJson as number) ?? PLATFORM_DEFAULTS.commissionPercent;
  const hstPercent = (settings?.find((s) => s.key === "hstPercent")?.valueJson as number) ?? PLATFORM_DEFAULTS.hstPercent;

  const setSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => apiClient.post(`/app-settings/${key}`, { value }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-settings"] }),
    onError: (err) => setError(err instanceof ApiClientError ? err.apiError.message : "Failed to update setting"),
  });

  const setFlag = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => apiClient.post(`/feature-flags/${key}`, { enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-flags"] }),
  });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-900">Platform settings</h1>

      {error && <p role="alert" className="mt-4 rounded-md bg-emergency-50 p-3 text-sm text-emergency-700">{error}</p>}

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Commission and tax</h2>
        <div className="mt-3 space-y-3 text-sm">
          <label className="flex items-center justify-between gap-4">
            <span>Platform commission (%, 0–20 allowed)</span>
            <input
              type="number"
              min={0}
              max={20}
              defaultValue={commissionPercent}
              onBlur={(e) => setSetting.mutate({ key: "commissionPercent", value: Number(e.target.value) })}
              className="w-24 rounded-md border border-slate-300 px-2 py-1 focus-ring"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span>HST (%)</span>
            <input
              type="number"
              min={0}
              max={30}
              defaultValue={hstPercent}
              onBlur={(e) => setSetting.mutate({ key: "hstPercent", value: Number(e.target.value) })}
              className="w-24 rounded-md border border-slate-300 px-2 py-1 focus-ring"
            />
          </label>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900">Feature flags</h2>
        <div className="mt-3 space-y-2">
          {flags?.map((f) => (
            <label key={f.key} className="flex items-center justify-between gap-4 text-sm">
              <span>
                <span className="font-medium">{f.key}</span>
                {f.description && <span className="block text-xs text-slate-500">{f.description}</span>}
              </span>
              <input
                type="checkbox"
                checked={f.enabled}
                onChange={(e) => setFlag.mutate({ key: f.key, enabled: e.target.checked })}
                className="h-5 w-5"
              />
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
