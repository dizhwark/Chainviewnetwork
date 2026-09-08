export function LegalPageShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1 text-xs text-slate-500">Template version — last updated {updated}</p>
      <div role="note" className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        This page is a plain-language template for local development and demonstration purposes. It has{" "}
        <strong>not</strong> been reviewed by a lawyer and must not be treated as final legal text or as legal
        advice. See <code>docs/legal-and-professional-review.md</code> in the repository for what still needs
        professional review before this policy governs real customers or plumbers.
      </div>
      <div className="prose prose-sm mt-6 max-w-none text-slate-700 [&_h2]:mt-6 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5">
        {children}
      </div>
    </div>
  );
}
