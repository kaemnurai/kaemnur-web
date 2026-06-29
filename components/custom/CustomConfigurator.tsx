"use client";

import { forwardRef, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  CATEGORIES,
  FEATURES,
  HOSTINGS,
  computeEstimate,
  formatIDR,
  formatRange,
  type EstimateForm,
} from "./estimate";
import { DomainPicker } from "./DomainPicker";
import { SummaryCard } from "./SummaryCard";
import { buildWhatsappUrl } from "./whatsapp";

const STEPS = [
  { title: "Kebutuhan", short: "Kebutuhan" },
  { title: "Domain & Hosting", short: "Domain" },
  { title: "Fitur Tambahan", short: "Fitur" },
  { title: "Ringkasan", short: "Ringkasan" },
];
const LAST = STEPS.length - 1;

// ── Small shared option card ──────────────────────────────────────────────
function OptionCard({
  active,
  onClick,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`flex flex-col items-start rounded-lg border px-3.5 py-3 text-left transition-colors ${
        active ? "border-cw-navy bg-cw-navy-soft" : "border-cw-line bg-cw-bg hover:border-cw-navy/30"
      }`}
    >
      <span className="text-sm font-semibold text-cw-fg">{title}</span>
      <span className="mt-1 text-xs text-cw-fg-muted">{subtitle}</span>
    </button>
  );
}

// ── Stepper header ────────────────────────────────────────────────────────
function Stepper({
  step,
  maxReached,
  onJump,
}: {
  step: number;
  maxReached: number;
  onJump: (i: number) => void;
}) {
  return (
    <ol className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1">
      {STEPS.map((s, i) => {
        const done = i < step;
        const current = i === step;
        const reachable = i <= maxReached;
        return (
          <li key={s.title} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && onJump(i)}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors ${
                current
                  ? "bg-cw-navy-soft"
                  : reachable
                    ? "hover:bg-cw-bg-soft"
                    : "cursor-not-allowed opacity-60"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  done
                    ? "bg-cw-green text-white"
                    : current
                      ? "bg-cw-navy text-white"
                      : "bg-cw-card-soft text-cw-fg-muted"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`hidden truncate text-xs font-semibold sm:block ${
                  current ? "text-cw-navy" : "text-cw-fg-sub"
                }`}
              >
                {s.title}
              </span>
              <span
                className={`truncate text-xs font-semibold sm:hidden ${
                  current ? "text-cw-navy" : "text-cw-fg-sub"
                }`}
              >
                {current ? s.short : ""}
              </span>
            </button>
            {i < LAST && <span aria-hidden className="hidden h-px w-3 shrink-0 bg-cw-line sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

// ── Step bodies ───────────────────────────────────────────────────────────
function DetailStep({
  form,
  setForm,
}: {
  form: EstimateForm;
  setForm: Dispatch<SetStateAction<EstimateForm>>;
}) {
  const cat = CATEGORIES[form.category];
  return (
    <div className="rounded-card border border-cw-line bg-cw-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold uppercase tracking-wide text-cw-fg-muted">
          Detail Kebutuhan
        </h3>
        <span className="inline-flex items-center gap-2 rounded-full border border-cw-navy/30 bg-cw-navy-soft px-3 py-1 text-xs font-semibold text-cw-navy">
          {cat.label}
        </span>
      </div>
      <p className="mt-1 text-sm text-cw-fg-sub">
        Pilih yang paling mendekati kebutuhan Anda — harga adalah biaya jasa pembuatan.
      </p>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {cat.details.map((d) => (
          <OptionCard
            key={d.key}
            active={form.detail === d.key}
            onClick={() => setForm((prev) => ({ ...prev, detail: d.key }))}
            title={d.label}
            subtitle={formatRange({ min: d.min, max: d.max })}
          />
        ))}
      </div>
    </div>
  );
}

function DomainHostingStep({
  form,
  setForm,
}: {
  form: EstimateForm;
  setForm: Dispatch<SetStateAction<EstimateForm>>;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-card border border-cw-line bg-cw-card p-5 sm:p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-cw-fg-muted">Pilih Domain</h3>
        <p className="mt-1 text-sm text-cw-fg-sub">
          Cari ekstensi yang Anda inginkan — harga mengikuti Rumahweb.
        </p>
        <div className="mt-4">
          <DomainPicker
            selected={form.domain}
            onSelect={(key) => setForm((prev) => ({ ...prev, domain: key }))}
          />
        </div>
      </div>

      <div className="rounded-card border border-cw-line bg-cw-card p-5 sm:p-6">
        <h3 className="text-sm font-bold uppercase tracking-wide text-cw-fg-muted">Pilih Hosting</h3>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {HOSTINGS.map((h) => (
            <OptionCard
              key={h.key}
              active={form.hosting === h.key}
              onClick={() => setForm((prev) => ({ ...prev, hosting: h.key }))}
              title={h.label}
              subtitle={h.price > 0 ? `${formatIDR(h.price)}/tahun` : "Belum perlu"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FeatureStep({
  form,
  setForm,
}: {
  form: EstimateForm;
  setForm: Dispatch<SetStateAction<EstimateForm>>;
}) {
  function toggleFeature(key: string) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(key)
        ? prev.features.filter((f) => f !== key)
        : [...prev.features, key],
    }));
  }

  return (
    <div className="rounded-card border border-cw-line bg-cw-card p-5 sm:p-6">
      <h3 className="text-sm font-bold uppercase tracking-wide text-cw-fg-muted">Fitur Tambahan</h3>
      <p className="mt-1 text-sm text-cw-fg-sub">Opsional — pilih fitur yang Anda butuhkan.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const checked = form.features.includes(f.key);
          return (
            <label
              key={f.key}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                checked
                  ? "border-cw-navy/50 bg-cw-navy-soft text-cw-fg"
                  : "border-cw-line bg-cw-bg text-cw-fg-sub hover:border-cw-navy/25"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleFeature(f.key)}
                className="h-4 w-4 accent-cw-navy"
              />
              {f.label}
            </label>
          );
        })}
      </div>

      <div className="mt-5">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-cw-fg-muted">
          Catatan kebutuhan (opsional)
        </label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="Contoh: Saya ingin aplikasi absensi karyawan dengan admin, export Excel, dan laporan bulanan."
          className="w-full resize-y rounded-btn border border-cw-line bg-cw-bg px-3 py-2.5 text-sm text-cw-fg outline-none placeholder:text-cw-fg-muted focus:border-cw-navy/60"
        />
      </div>
    </div>
  );
}

// ── Orchestrator ──────────────────────────────────────────────────────────
export const CustomConfigurator = forwardRef<
  HTMLElement,
  { form: EstimateForm; setForm: Dispatch<SetStateAction<EstimateForm>> }
>(function CustomConfigurator({ form, setForm }, ref) {
  const [step, setStep] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const topRef = useRef<HTMLDivElement>(null);
  const breakdown = computeEstimate(form);

  function scrollToTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  function goto(next: number) {
    const clamped = Math.max(0, Math.min(LAST, next));
    setStep(clamped);
    setMaxReached((m) => Math.max(m, clamped));
    // Let the DOM paint the new step before scrolling.
    requestAnimationFrame(scrollToTop);
  }

  const showSummaryAside = step >= 0 && step < LAST;

  return (
    <section
      ref={ref}
      className="scroll-mt-16 border-t border-cw-line bg-cw-bg px-6 pb-14 pt-16 sm:px-10 lg:px-20"
    >
      <div className="mx-auto max-w-[1680px]">
      <div ref={topRef} className="scroll-mt-20" />

      {/* Heading */}
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cw-orange-soft text-cw-orange-hover">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.75} stroke="currentColor" className="h-6 w-6">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path d="M8 7h8M8 11h0M12 11h0M16 11h0M8 15h0M12 15h0M16 15h0" strokeLinecap="round" />
          </svg>
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-cw-orange-hover">
              Langkah 2
            </span>
            <h2 className="mt-0.5 text-lg font-bold text-cw-fg sm:text-xl">Hitung Estimasi Biaya</h2>
            <p className="mt-0.5 text-sm text-cw-fg-sub">
              Lengkapi detail di bawah ini — total estimasi awal = biaya jasa + domain + hosting.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cw-navy/30 bg-cw-navy-soft px-3 py-1 text-xs font-semibold text-cw-navy">
            {CATEGORIES[form.category].label}
          </span>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-7 rounded-card border border-cw-line bg-cw-bg-soft p-2 sm:p-2.5">
        <Stepper step={step} maxReached={maxReached} onJump={goto} />
      </div>

      {/* Steps 0–2 — form + sticky summary */}
      {showSummaryAside && (
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:gap-8">
          <div className="space-y-5">
            {step === 0 && <DetailStep form={form} setForm={setForm} />}
            {step === 1 && <DomainHostingStep form={form} setForm={setForm} />}
            {step === 2 && <FeatureStep form={form} setForm={setForm} />}
            <NavButtons
              step={step}
              onBack={() => goto(step - 1)}
              onNext={() => goto(step + 1)}
              nextLabel={step === 2 ? "Lihat Ringkasan" : "Lanjut"}
              total={formatRange(breakdown.total)}
            />
          </div>
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <SummaryCard form={form} variant="aside" />
          </aside>
        </div>
      )}

      {/* Last step — final summary */}
      {step === LAST && (
        <div className="mx-auto max-w-2xl">
          <SummaryCard form={form} variant="full" />
          <div className="mt-5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => goto(step - 1)}
              className="inline-flex items-center gap-1.5 rounded-btn border border-cw-line bg-cw-card px-5 py-3 text-sm font-semibold text-cw-fg transition-colors hover:bg-cw-bg-soft"
            >
              ← Kembali
            </button>
            <button
              type="button"
              onClick={() => goto(0)}
              className="text-sm font-semibold text-cw-fg-muted transition-colors hover:text-cw-navy"
            >
              Mulai dari awal
            </button>
          </div>
        </div>
      )}

      {/* Mobile sticky CTA — total + WhatsApp reachable from any step */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-cw-line bg-cw-card/95 px-4 py-3 shadow-card-lg backdrop-blur lg:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cw-fg-muted">
            Total estimasi
          </p>
          <p className="text-sm font-bold text-cw-navy">{formatRange(breakdown.total)}</p>
        </div>
        <a
          href={buildWhatsappUrl(form)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-btn bg-cw-green px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-cw-green-hover"
        >
          WhatsApp
        </a>
      </div>
      <div className="h-16 lg:hidden" aria-hidden />
      </div>
    </section>
  );
});

function NavButtons({
  step,
  onBack,
  onNext,
  nextLabel,
  total,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  total: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 pt-1">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 0}
        className={`inline-flex items-center gap-1.5 rounded-btn border px-5 py-3 text-sm font-semibold transition-colors ${
          step === 0
            ? "cursor-not-allowed border-cw-line text-cw-fg-muted opacity-50"
            : "border-cw-line bg-cw-card text-cw-fg hover:bg-cw-bg-soft"
        }`}
      >
        ← Kembali
      </button>

      <div className="flex items-center gap-4">
        <div className="hidden text-right sm:block">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-cw-fg-muted">
            Total estimasi
          </p>
          <p className="text-sm font-bold text-cw-navy">{total}</p>
        </div>
        <button
          type="button"
          onClick={onNext}
          className="group inline-flex items-center gap-2 rounded-btn bg-cw-navy px-6 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-cw-navy-hover"
        >
          {nextLabel}
          <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} stroke="currentColor" className="h-4 w-4 transition-transform group-hover:translate-x-0.5">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
