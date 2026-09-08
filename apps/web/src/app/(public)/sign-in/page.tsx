import Link from "next/link";
import { SignInForm } from "@/components/SignInForm";

export default function SignInPage() {
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-600">Sign in to track your bookings and message your plumber.</p>
      <div className="mt-6">
        <SignInForm redirectTo="/" />
      </div>
      <p className="mt-6 text-sm text-slate-600">
        New here?{" "}
        <Link href="/sign-up" className="font-medium text-brand-700 underline">
          Create an account
        </Link>
      </p>
      <p className="mt-2 text-sm text-slate-600">
        Are you a plumber?{" "}
        <Link href="/apply" className="font-medium text-brand-700 underline">
          Apply to join
        </Link>
      </p>
    </div>
  );
}
