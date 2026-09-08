import { PageHeader } from "@/components/PageHeader";
import { BRAND } from "@maybe/config";

export default function AccessibilityPage() {
  return (
    <>
      <PageHeader title="Accessibility statement" />
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 text-sm text-slate-700">
        <p>
          {BRAND.name} targets WCAG 2.2 Level AA. That means, throughout the product, we aim for: semantic HTML and
          proper labels, full keyboard navigation with visible focus states, sufficient colour contrast, support for
          reduced-motion preferences and text resizing, accessible dialogs, and status information (like a
          plumber&apos;s arrival) that isn&apos;t conveyed by colour or a map alone.
        </p>
        <p>
          This is an ongoing target, not a certification. If you encounter an accessibility barrier anywhere on{" "}
          {BRAND.name}, please contact us at {BRAND.supportEmail} so we can fix it.
        </p>
      </div>
    </>
  );
}
