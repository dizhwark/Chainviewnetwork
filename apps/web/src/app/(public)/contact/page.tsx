import { PageHeader } from "@/components/PageHeader";
import { BRAND } from "@maybe/config";

export default function ContactPage() {
  return (
    <>
      <PageHeader title="Contact and support" />
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 text-sm text-slate-700">
        <p>
          For help with an existing booking, sign in and use the support option on your booking, or use the status
          link we emailed you when you submitted your request.
        </p>
        <div className="rounded-lg border border-slate-200 p-5">
          <p><strong>Email:</strong> {BRAND.supportEmail}</p>
          <p className="mt-1"><strong>Phone:</strong> {BRAND.supportPhoneDisplay}</p>
        </div>
        <p className="text-xs text-slate-500">
          Placeholder contact details for local development — replace with real support channels before launch.
        </p>
      </div>
    </>
  );
}
