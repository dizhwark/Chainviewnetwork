"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SignInForm } from "@/components/SignInForm";
import { BRAND } from "@maybe/config";

function AdminSignInForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/admin/dashboard";
  return <SignInForm redirectTo={redirectTo} adminOnlyHint />;
}

export default function AdminSignInPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="text-2xl font-bold text-slate-900">{BRAND.name} admin</h1>
      <p className="mt-1 text-sm text-slate-600">Sign in with your staff account.</p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <AdminSignInForm />
        </Suspense>
      </div>
    </div>
  );
}
