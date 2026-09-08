"use client";

import { useState } from "react";
import { apiClient, ApiClientError } from "@/lib/api-client";

export default function ReviewPage({ params }: { params: { token: string } }) {
  const [overallRating, setOverallRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post(`/reviews/submit/${params.token}`, { overallRating, comment });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.apiError.message : "We couldn't submit your review.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-700">Thanks for your review!</h1>
        <p className="mt-2 text-slate-600">Your feedback helps other customers choose the right plumber.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Rate your plumber</h1>
      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        {error && (
          <p role="alert" className="rounded-md bg-emergency-50 p-3 text-sm text-emergency-700">{error}</p>
        )}
        <fieldset>
          <legend className="text-sm font-medium text-slate-900">Overall rating</legend>
          <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Overall rating out of 5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={overallRating === n}
                onClick={() => setOverallRating(n)}
                className={`h-10 w-10 rounded-md border text-sm font-semibold focus-ring ${
                  overallRating >= n ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-600"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-slate-900">
            Tell us about your experience (optional)
          </label>
          <textarea
            id="comment"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit review"}
        </button>
      </form>
    </div>
  );
}
