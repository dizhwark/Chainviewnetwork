"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { BRAND } from "@maybe/config";
import { useCurrentUser } from "@/lib/use-current-user";
import { apiClient } from "@/lib/api-client";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/requests", label: "Service requests" },
  { href: "/admin/applications", label: "Plumber applications" },
  { href: "/admin/audit-log", label: "Audit log" },
  { href: "/admin/settings", label: "Settings" },
];

const STAFF_ROLES = ["SUPPORT_AGENT", "ADMIN", "SUPER_ADMIN"];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || !STAFF_ROLES.includes(user.role))) {
      router.replace(`/admin/sign-in?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading || !user || !STAFF_ROLES.includes(user.role)) {
    return <div className="p-8 text-sm text-slate-500">Loading admin portal...</div>;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 flex-none border-r border-slate-200 bg-slate-50 p-4">
        <Link href="/admin/dashboard" className="text-lg font-bold text-brand-700">
          {BRAND.name} Admin
        </Link>
        <nav className="mt-6 space-y-1" aria-label="Admin">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                pathname.startsWith(item.href) ? "bg-brand-100 text-brand-800" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500">
          <p>{user.email}</p>
          <p className="mt-1">{user.role.replace("_", " ")}</p>
          <button
            onClick={async () => {
              await apiClient.post("/auth/logout");
              router.push("/admin/sign-in");
              router.refresh();
            }}
            className="mt-3 text-brand-700 underline"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
