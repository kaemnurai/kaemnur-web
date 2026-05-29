import type { Metadata } from "next";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "About",
  description: "The story and values behind Kaemnur productivity software.",
};

const values = [
  {
    icon: "wifi-off" as const,
    title: "Offline-first",
    body: "Tools that work without a constant connection. Your data lives on your machine, and the app keeps working whether you're online or not.",
  },
  {
    icon: "zap" as const,
    title: "Practical",
    body: "Every feature earns its place by solving a real administrative problem. A few things done well beats a feature checklist nobody uses.",
  },
  {
    icon: "package" as const,
    title: "Lightweight",
    body: "Small downloads, fast startup, low memory. Kaemnur apps respect the machine you already own.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8 lg:py-12">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
        About Kaemnur
      </p>
      <h1 className="mt-2 text-3xl font-bold text-fg md:text-4xl">
        Productivity software for people who just want to get the work done.
      </h1>

      <div className="mt-6 space-y-4 text-[14px] leading-relaxed text-fg-sub">
        <p>
          Kaemnur started from a simple frustration: most productivity software is
          either bloated, locked behind a subscription, or useless without an internet
          connection. We wanted tools that respect your time, your hardware, and your data.
        </p>
        <p>
          So we build offline-first desktop apps focused on administrative workflow
          automation — practical software you download once and own. Everything is free
          to start, with an optional PRO upgrade when you need the full toolset.
        </p>
      </div>

      <h2 className="mb-4 mt-12 text-lg font-bold text-fg">Our values</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {values.map((v) => (
          <div
            key={v.title}
            className="rounded-card border border-line bg-card p-4"
          >
            <Icon name={v.icon} size={18} className="text-accent" />
            <h3 className="mt-3 text-[14px] font-semibold text-fg">{v.title}</h3>
            <p className="mt-1.5 text-[12px] leading-relaxed text-fg-sub">{v.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
