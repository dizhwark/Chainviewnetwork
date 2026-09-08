"use client";

import { useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { trackEvent } from "@/lib/analytics";

interface CoverageResult {
  covered: boolean;
  zone: { id: string; name: string } | null;
}

export function CoverageCheckForm() {
  const [postalCode, setPostalCode] = useState("");
  const [result, setResult] = useState<CoverageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await apiClient.get<CoverageResult>(`/service-zones/coverage-check?postalCode=${encodeURIComponent(postalCode)}`);
      setResult(res);
      trackEvent("address_submitted", { source: "homepage_coverage_check" });
    } catch {
      setError("We couldn't check that postal code right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row" aria-describedby="coverage-help">
        <label htmlFor="postal-code" className="sr-only">
          Postal code
        </label>
        <input
          id="postal-code"
          name="postalCode"
          type="text"
          required
          placeholder="Enter your postal code (e.g. M5V 3A8)"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value)}
          className="w-full rounded-md border border-slate-300 px-4 py-3 text-base focus-ring"
        />
        <button
          type="submit"
          disabled={loading}
          className="whitespace-nowrap rounded-md bg-brand-600 px-5 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Checking..." : "Check coverage"}
        </button>
      </form>
      <p id="coverage-help" className="mt-2 text-xs text-slate-500">
        We&apos;re currently serving select Toronto postal codes. More areas are coming soon.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-emergency-600">
          {error}
        </p>
      )}

      {result && (
        <div role="status" className="mt-4 rounded-md border p-4 text-sm">
          {result.covered ? (
            <p className="text-brand-700">
              Good news — we serve <strong>{result.zone?.name}</strong>.{" "}
              <Link href="/request" className="underline">
                Book a plumber now
              </Link>
              .
            </p>
          ) : (
            <p className="text-slate-700">
              We don&apos;t serve that area yet. <Link href="/contact" className="underline">Let us know</Link> where
              you&apos;d like us to expand next.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
