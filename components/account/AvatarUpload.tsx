"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";

const BUCKET = "avatars";

export function AvatarUpload({
  userId,
  initialUrl,
  fallbackName,
}: {
  userId: string;
  initialUrl: string | null;
  fallbackName: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const bg = getAvatarColor(userId || fallbackName);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("PNG, JPG atau WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("Maksimal 2MB.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const next = `${data.publicUrl}?v=${Date.now()}`;
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: next }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan foto.");
      setUrl(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-2 text-[12px] font-medium text-fg">Foto Profil</p>
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span
            className="grid h-12 w-12 place-items-center rounded-full text-[18px] font-bold"
            style={{ backgroundColor: bg, color: getAvatarTextColor(bg) }}
          >
            {getInitial(fallbackName)}
          </span>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-9 items-center gap-1.5 rounded-btn border border-line px-3 text-[13px] font-medium text-fg-sub hover:border-fg-muted hover:text-fg disabled:opacity-50"
        >
          <Icon name="plus" size={14} />
          {busy ? "Mengunggah…" : "Unggah Foto"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <p className="mt-1.5 text-[11px] text-fg-muted">PNG, JPG atau WEBP. Maksimal 2MB.</p>
      {error && <p className="mt-1 text-[12px] text-danger">{error}</p>}
    </div>
  );
}
