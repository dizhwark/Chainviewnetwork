import { BRAND } from "@maybe/config";

export function EmergencyDisclaimer({ compact = false }: { compact?: boolean }) {
  return (
    <div
      role="note"
      aria-label="Emergency safety disclaimer"
      className={`rounded-lg border border-emergency-500/40 bg-emergency-50 text-emergency-700 ${compact ? "p-3 text-xs" : "p-4 text-sm"}`}
    >
      <p className="font-semibold">Before you book, in a real emergency:</p>
      <p className="mt-1">
        For flooding, shut off the water supply immediately if it is safe to do so. For gas smells, fire, electrical
        danger, or any immediate threat to life or property, leave the area and call 911 or your utility&apos;s
        emergency line right away. {BRAND.name} is not a replacement for 911 or emergency utility services.
      </p>
    </div>
  );
}
