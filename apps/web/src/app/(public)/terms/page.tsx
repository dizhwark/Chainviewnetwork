import { LegalPageShell } from "@/components/LegalPageShell";
import { BRAND } from "@maybe/config";

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of service" updated="template draft">
      <h2>What {BRAND.name} is</h2>
      <p>
        {BRAND.name} is a marketplace that connects customers who need plumbing work with independently owned and
        operated, licensed plumbing businesses. {BRAND.name} is not itself a plumbing contractor and does not
        perform plumbing work.
      </p>
      <h2>Accounts</h2>
      <p>You must provide accurate information and keep your login credentials secure. You&apos;re responsible for activity on your account.</p>
      <h2>Bookings and payment</h2>
      <p>
        Non-emergency work requires your explicit approval of a written estimate before it begins. Payment is
        authorized and captured through our payment processor once work is confirmed complete, per the pricing shown
        at booking.
      </p>
      <h2>Cancellations and refunds</h2>
      <p>
        See our separate Cancellation Policy and Refund and Dispute Policy pages. Refunds are decided by a human
        administrator after reviewing the relevant evidence — there is no automatic refund.
      </p>
      <h2>Plumber conduct</h2>
      <p>
        Plumbers using {BRAND.name} agree to maintain valid licensing (where applicable) and insurance, and to the
        separate Contractor/Provider Agreement.
      </p>
      <h2>Limitation of liability</h2>
      <p>
        This section requires review by an Ontario lawyer before publication — see{" "}
        <code>docs/legal-and-professional-review.md</code>.
      </p>
    </LegalPageShell>
  );
}
