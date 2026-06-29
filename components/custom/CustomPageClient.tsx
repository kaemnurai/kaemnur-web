"use client";

import { useRef, useState } from "react";
import { defaultForm, type Category, type EstimateForm } from "./estimate";
import { CustomHero } from "./CustomHero";
import { FeatureHighlights } from "./FeatureHighlights";
import { NeedsSection } from "./NeedsSection";
import { CustomConfigurator } from "./CustomConfigurator";
import { ProcessSection } from "./ProcessSection";
import { CustomFAQ } from "./CustomFAQ";
import { WhatsappCtaSection } from "./WhatsappCtaSection";

export function CustomPageClient() {
  const [form, setForm] = useState<EstimateForm>(() => defaultForm("website"));
  const needsRef = useRef<HTMLElement>(null);
  const configuratorRef = useRef<HTMLElement>(null);

  const scrollToNeeds = () =>
    needsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollToConfigurator = () =>
    configuratorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  function selectCategory(category: Category) {
    setForm((prev) =>
      prev.category === category ? prev : { ...defaultForm(category), notes: prev.notes }
    );
  }

  return (
    <>
      <CustomHero onStart={scrollToConfigurator} onPreview={scrollToNeeds} />

      <FeatureHighlights />

      <NeedsSection ref={needsRef} category={form.category} onSelect={selectCategory} />

      <CustomConfigurator ref={configuratorRef} form={form} setForm={setForm} />

      <ProcessSection />

      <CustomFAQ />

      <WhatsappCtaSection form={form} />

      <footer className="border-t border-cw-line bg-cw-bg py-8 text-center text-xs text-cw-fg-muted">
        © {new Date().getFullYear()} Kaemnur — Layanan Custom.
      </footer>
    </>
  );
}
