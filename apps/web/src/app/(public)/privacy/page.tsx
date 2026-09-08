import { LegalPageShell } from "@/components/LegalPageShell";
import { BRAND } from "@maybe/config";

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy policy" updated="template draft">
      <p>
        This template is written with PIPEDA (Personal Information Protection and Electronic Documents Act)
        principles in mind — accountability, identifying purposes, consent, limiting collection, limiting use and
        disclosure, accuracy, safeguards, openness, individual access, and challenging compliance — but has not been
        reviewed by a privacy professional.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, email, phone number</li>
        <li>Service addresses you provide</li>
        <li>Booking details: problem description, photos you choose to upload, urgency</li>
        <li>Payment tokens from our payment processor (we never store raw card numbers)</li>
        <li>For plumbers: business, licensing, and insurance details required for verification</li>
        <li>Location data, only while a job is active and only for the plumber assigned to it</li>
      </ul>
      <h2>Why we collect it</h2>
      <p>To operate the marketplace: matching you with a plumber, processing payment, and providing support.</p>
      <h2>Location data</h2>
      <p>
        Live location sharing starts only after a plumber accepts a job and begins travelling, and stops when they
        arrive or the booking ends. We keep only the minimum location history needed for safety and dispute
        resolution, for a limited retention period.
      </p>
      <h2>Your rights</h2>
      <p>
        You can request a copy of your data or request deletion of your account from your account settings. Some
        information may be retained where required by law (for example, financial records).
      </p>
      <h2>Marketing vs. service communication</h2>
      <p>Marketing consent is collected separately from essential service notifications, and you can opt out of marketing at any time without affecting your ability to use {BRAND.name}.</p>
    </LegalPageShell>
  );
}
