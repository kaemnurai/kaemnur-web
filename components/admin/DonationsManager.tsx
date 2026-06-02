"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { formatRupiah } from "@/lib/utils";

type Donation = {
  id: string;
  donorName: string;
  amount: number;
  message: string | null;
  isApproved: boolean;
  createdAt: string;
};

export function DonationsManager({ donations: initial }: { donations: Donation[] }) {
  const [donations, setDonations] = useState(initial);
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [approveNew, setApproveNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function add() {
    const amt = Math.round(Number(amount) || 0);
    if (!donorName.trim() || amt <= 0) {
      toast("Lengkapi nama & nominal.", "error");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorName: donorName.trim(), amount: amt, message: message.trim(), isApproved: approveNew }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "Gagal.");
      setDonations((prev) => [
        { id: d.id, donorName: d.donorName, amount: d.amount, message: d.message, isApproved: d.isApproved, createdAt: d.createdAt },
        ...prev,
      ]);
      setDonorName("");
      setAmount("");
      setMessage("");
      toast("Donasi ditambahkan.", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleApprove(d: Donation) {
    setBusyId(d.id);
    try {
      const res = await fetch(`/api/admin/donations/${d.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !d.isApproved }),
      });
      if (!res.ok) throw new Error("Gagal.");
      setDonations((prev) => prev.map((x) => (x.id === d.id ? { ...x, isApproved: !x.isApproved } : x)));
    } catch {
      toast("Gagal mengubah status.", "error");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(d: Donation) {
    if (!window.confirm(`Hapus donasi dari ${d.donorName}?`)) return;
    setBusyId(d.id);
    try {
      const res = await fetch(`/api/admin/donations/${d.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Gagal.");
      setDonations((prev) => prev.filter((x) => x.id !== d.id));
    } catch {
      toast("Gagal menghapus.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-card border border-line bg-card p-5">
        <h2 className="text-[14px] font-semibold text-fg">Tambah Donasi</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            placeholder="Nama donatur"
            className="h-9 rounded-btn border border-line bg-bg px-3 text-[13px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            inputMode="numeric"
            placeholder="Nominal (Rp)"
            className="h-9 rounded-btn border border-line bg-bg px-3 text-[13px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
        </div>
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Pesan (opsional)"
          className="mt-3 h-9 w-full rounded-btn border border-line bg-bg px-3 text-[13px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
        <div className="mt-3 flex items-center justify-between">
          <label className="flex items-center gap-2 text-[13px] text-fg">
            <input
              type="checkbox"
              checked={approveNew}
              onChange={(e) => setApproveNew(e.target.checked)}
              className="h-4 w-4 accent-[#F4B400]"
            />
            Langsung approve
          </label>
          <button
            type="button"
            onClick={add}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-btn bg-accent px-4 text-[12px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
          >
            {saving ? <Spinner className="h-4 w-4" /> : <Icon name="plus" size={13} />}
            Tambah
          </button>
        </div>
      </div>

      {donations.length === 0 ? (
        <div className="rounded-card border border-dashed border-line bg-card p-12 text-center text-[13px] text-fg-sub">
          Belum ada donasi.
        </div>
      ) : (
        <div className="space-y-2">
          {donations.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-card border border-line bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-semibold text-fg">{d.donorName}</p>
                  {d.isApproved ? (
                    <span className="rounded bg-success/15 px-2 py-0.5 text-[10px] font-semibold text-success">Approved</span>
                  ) : (
                    <span className="rounded bg-line px-2 py-0.5 text-[10px] font-semibold text-fg-sub">Pending</span>
                  )}
                </div>
                {d.message && <p className="truncate text-[12px] text-fg-sub">{d.message}</p>}
              </div>
              <span className="shrink-0 text-[14px] font-bold text-accent">{formatRupiah(d.amount)}</span>
              <button
                type="button"
                onClick={() => toggleApprove(d)}
                disabled={busyId === d.id}
                title={d.isApproved ? "Unapprove" : "Approve"}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-btn border border-line text-fg-sub hover:text-fg disabled:opacity-50"
              >
                <Icon name={d.isApproved ? "x" : "check"} size={14} />
              </button>
              <button
                type="button"
                onClick={() => remove(d)}
                disabled={busyId === d.id}
                title="Hapus"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-btn border border-danger/40 text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
