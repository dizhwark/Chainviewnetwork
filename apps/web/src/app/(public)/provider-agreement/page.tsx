import { LegalPageShell } from "@/components/LegalPageShell";
import { BRAND } from "@maybe/config";

export default function ProviderAgreementPage() {
  return (
    <LegalPageShell title="Contractor / provider agreement" updated="placeholder">
      <p>
        This is a placeholder for the full contractor agreement between {BRAND.name} and each independent plumbing
        business using the platform. It must be drafted and reviewed by an Ontario lawyer before any plumber is
        asked to accept it — see <code>docs/legal-and-professional-review.md</code>.
      </p>
      <h2>Expected topics</h2>
      <ul>
        <li>Independent contractor status and scope of the relationship</li>
        <li>Licensing, insurance, and ongoing verification requirements</li>
        <li>Commission structure and payout terms</li>
        <li>Standards of conduct and grounds for suspension</li>
        <li>Data handling for customer information shared through the platform</li>
      </ul>
    </LegalPageShell>
  );
}
