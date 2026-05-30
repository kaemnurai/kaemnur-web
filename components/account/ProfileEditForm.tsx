"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";

export function ProfileEditForm({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Gagal menyimpan.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <Input
        id="display-name"
        label="Nama Tampilan"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nama Anda"
        required
      />
      <Input
        id="email"
        label="Email"
        value={email}
        readOnly
        className="opacity-60 cursor-not-allowed"
      />
      {error && <p className="text-[12px] text-danger">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="h-9 rounded-btn bg-accent px-4 text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
      >
        {saving ? "Menyimpan…" : saved ? "✓ Tersimpan" : "Simpan"}
      </button>
    </form>
  );
}
