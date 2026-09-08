import { LegalPageShell } from "@/components/LegalPageShell";

export default function CancellationPolicyPage() {
  return (
    <LegalPageShell title="Cancellation policy" updated="template draft">
      <h2>Cancelling before a plumber is assigned</h2>
      <p>You can cancel a request at any time before a plumber accepts, at no charge.</p>
      <h2>Cancelling after a plumber is assigned</h2>
      <p>
        Once a plumber has accepted and is on the way, a late cancellation may be subject to a cancellation fee, set
        by an administrator and always disclosed before you confirm the cancellation. No fee is charged by default
        until this is configured.
      </p>
      <h2>If the plumber cancels</h2>
      <p>If a plumber cancels after accepting, we automatically look for another eligible plumber and never charge you for a cancelled job.</p>
      <h2>Emergency requests</h2>
      <p>Given the time-sensitive nature of emergency requests, cancellation terms may differ — this will always be shown before you confirm booking.</p>
    </LegalPageShell>
  );
}
