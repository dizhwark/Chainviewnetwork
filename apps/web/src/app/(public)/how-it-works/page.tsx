import { PageHeader } from "@/components/PageHeader";
import { EmergencyDisclaimer } from "@/components/EmergencyDisclaimer";

const STEPS = [
  { title: "Tell us your address and problem", body: "Enter or confirm your service address, choose the closest matching plumbing category, and describe the issue. Add photos or a short video if you can — it helps plumbers prepare." },
  { title: "Tell us how urgent it is", body: "Choose scheduled, as-soon-as-possible, or emergency. Emergency and after-hours requests may include an additional fee, always shown before you pay." },
  { title: "Get matched with a plumber", body: "We match you with a nearby, available, verified plumber who offers that service. During our early manual-dispatch phase, a member of our team may call to confirm details before assigning a plumber." },
  { title: "Track arrival", body: "Once a plumber accepts, you'll see their status update. Where live location sharing is enabled, you can track their arrival in the app." },
  { title: "Get an itemized estimate", body: "For anything beyond a simple fixed-price job, your plumber inspects the issue and gives you a written estimate — labour, materials, taxes, and fees broken out separately." },
  { title: "Approve before non-emergency work begins", body: "You explicitly approve or reject the estimate. If the scope changes, you'll see a new estimate version and get to approve that too." },
  { title: "Pay securely and review", body: "Once work is done, you receive a digital invoice and pay through the app. Afterward, you can rate and review your plumber." },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader title="How it works" subtitle="From a leaky faucet to a burst pipe — here's what happens after you submit a request." />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <ol className="space-y-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <h2 className="font-semibold text-slate-900">{step.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <EmergencyDisclaimer />
        </div>
      </div>
    </>
  );
}
