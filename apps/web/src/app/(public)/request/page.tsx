import { Suspense } from "react";
import { RequestForm } from "@/components/RequestForm";

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-4 py-10 text-sm text-slate-500">Loading...</div>}>
      <RequestForm />
    </Suspense>
  );
}
