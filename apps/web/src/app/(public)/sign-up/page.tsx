"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, ApiClientError } from "@/lib/api-client";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post("/auth/register", form);
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.apiError.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">We only collect what we need to book and manage your service requests.</p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-emergency-50 p-3 text-sm text-emergency-700">
            {error}
          </p>
        )}
        {[
          { key: "fullName", label: "Full name", type: "text", autoComplete: "name" },
          { key: "email", label: "Email", type: "email", autoComplete: "email" },
          { key: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
          { key: "password", label: "Password", type: "password", autoComplete: "new-password" },
        ].map((field) => (
          <div key={field.key}>
            <label htmlFor={field.key} className="block text-sm font-medium text-slate-900">
              {field.label}
            </label>
            <input
              id={field.key}
              type={field.type}
              required
              minLength={field.key === "password" ? 8 : undefined}
              autoComplete={field.autoComplete}
              value={form[field.key as keyof typeof form]}
              onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring"
            />
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-6 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-brand-700 underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
