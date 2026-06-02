"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { formatRupiah } from "@/lib/utils";

type Donation = { id: string; donorName: string; amount: number; message: string | null };

const MEDALS = ["🥇", "🥈", "🥉"];

// Renders nothing unless an admin has set AppSettings.trakteerUrl.
export function DonationSection() {
  const [trakteerUrl, setTrakteerUrl] = useState<string | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/donations")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d) {
          setTrakteerUrl(d.trakteerUrl ?? null);
          setDonations(d.donations ?? []);
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || !trakteerUrl) return null;

  return (
    <section className="mt-10 rounded-card border border-line bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-fg">Dukung Pengembangan</h2>
          <p className="mt-1 text-[13px] text-fg-sub">
            Donasi membantu kami terus mengembangkan aplikasi gratis untuk Anda.
          </p>
        </div>
        <a
          href={trakteerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center gap-2 rounded-btn bg-[#F4B400] px-4 text-[13px] font-semibold text-black transition-opacity hover:opacity-90 active:opacity-70"
        >
          <Icon name="heart" size={16} />
          Donasi via Trakteer
        </a>
      </div>

      <div className="mt-5">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
          <Icon name="trophy" size={13} className="text-accent" />
          Top Donatur
        </p>
        {donations.length === 0 ? (
          <p className="rounded-btn border border-dashed border-line bg-bg px-4 py-6 text-center text-[13px] text-fg-sub">
            Jadilah donatur pertama!
          </p>
        ) : (
          <ul className="space-y-2">
            {donations.map((d, i) => (
              <li key={d.id} className="flex items-center gap-3 rounded-btn border border-line bg-bg px-3 py-2.5">
                <span
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[14px] font-bold ${
                    i < 3 ? "text-accent" : "text-fg-muted"
                  }`}
                >
                  {i < 3 ? MEDALS[i] : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-fg">{d.donorName}</p>
                  {d.message && <p className="truncate text-[12px] text-fg-sub">{d.message}</p>}
                </div>
                <span className="shrink-0 text-[14px] font-bold text-accent">{formatRupiah(d.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
