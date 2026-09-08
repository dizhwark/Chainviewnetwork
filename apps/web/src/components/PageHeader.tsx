export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-2 text-slate-600">{subtitle}</p>}
      </div>
    </div>
  );
}
