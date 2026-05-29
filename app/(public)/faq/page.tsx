import type { Metadata } from "next";
import { Accordion, type AccordionItem } from "@/components/ui/Accordion";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Common questions about licenses, activation, upgrades, and downloads.",
};

const faqs: AccordionItem[] = [
  {
    q: "How do I download a Kaemnur app?",
    a: "Open the Library tab, pick your platform, and the installer downloads directly. No account or sign-up required.",
  },
  {
    q: "What's the difference between FREE and PRO?",
    a: "Every app is fully usable for free. PRO unlocks the complete toolset — the extra features marked PRO on each product page. You upgrade only when you need them.",
  },
  {
    q: "How do I upgrade to PRO?",
    a: "Click any 'Upgrade to PRO' button, fill in your name and WhatsApp number, and you'll be taken to WhatsApp to complete the upgrade with us directly. No subscriptions to manage.",
  },
  {
    q: "How does the license key work?",
    a: "After upgrading you'll receive a license key in the format KAEM-XXXX-XXXX-CCCC. You enter it once inside the desktop app. Validation happens fully offline on your machine — no internet check needed.",
  },
  {
    q: "Where do I activate my license?",
    a: "In the desktop app, go to Settings → About → View License Details, or use 'Upgrade to PRO → Activate License', then paste your key.",
  },
  {
    q: "Do I need to be online to use the app?",
    a: "No. Kaemnur apps are offline-first. You only need a connection to download the installer; everything else, including license validation, works offline.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8 lg:py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        News & Help
      </p>
      <h1 className="mt-2 text-3xl font-bold text-fg md:text-4xl">
        Frequently asked questions
      </h1>
      <p className="mt-2 text-[14px] text-fg-sub">
        Licenses, activation, upgrades, and downloads.
      </p>

      <div className="mt-8">
        <Accordion items={faqs} />
      </div>
    </div>
  );
}
