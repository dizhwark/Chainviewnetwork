import { LegalPageShell } from "@/components/LegalPageShell";
import { BRAND } from "@maybe/config";

export default function RefundDisputePolicyPage() {
  return (
    <LegalPageShell title="Refund and dispute policy" updated="template draft">
      <h2>There is no automatic refund button</h2>
      <p>
        If something goes wrong with a job, you can open a dispute from your booking history. You&apos;ll select a
        reason, add a written explanation, and can attach evidence such as photos.
      </p>
      <h2>How disputes are resolved</h2>
      <ol>
        <li>You report the problem with evidence.</li>
        <li>The plumber has a chance to respond.</li>
        <li>A support agent or administrator reviews the booking, estimate, invoice, photos, and message history.</li>
        <li>An administrator decides: partial refund, full refund, account credit (where enabled), or no refund — with a written reason.</li>
        <li>You&apos;re notified of the outcome, and the full history is kept for audit purposes.</li>
      </ol>
      <h2>Chargebacks</h2>
      <p>If you dispute a charge directly with your card issuer instead of through {BRAND.name}, we&apos;ll respond to the chargeback using the same booking evidence.</p>
    </LegalPageShell>
  );
}
