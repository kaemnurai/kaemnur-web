"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { Spinner } from "@/components/ui/Spinner";
import { toast } from "@/components/ui/Toast";
import { addInstaller } from "@/app/(admin)/admin/actions";

const SHA256_RE = /^[a-f0-9]{64}$/i;

type Product = { id: string; name: string; slug: string };

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** PUT straight to the presigned R2 URL — XHR gives us upload progress; fetch doesn't. */
function putWithProgress(url: string, file: File, contentType: string, onProgress: (pct: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload ke R2 gagal (HTTP ${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Upload ke R2 gagal — periksa koneksi atau konfigurasi CORS bucket."));
    xhr.send(file);
  });
}

export function InstallerUploadForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [platform, setPlatform] = useState("WINDOWS");
  const [version, setVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sha256, setSha256] = useState("");
  const [hashing, setHashing] = useState(false);
  const [changelogNotes, setChangelogNotes] = useState("");
  const [stage, setStage] = useState<null | "presign" | "upload" | "save">(null);
  const [progress, setProgress] = useState(0);

  const busy = hashing || stage !== null;

  async function handleFileChange(selected: File | null) {
    setFile(selected);
    setSha256("");
    if (!selected) return;
    setHashing(true);
    try {
      const buffer = await selected.arrayBuffer();
      const digest = await crypto.subtle.digest("SHA-256", buffer);
      setSha256(toHex(digest));
    } catch {
      toast("Gagal menghitung sha256 otomatis — isi manual dari output build.", "error");
    } finally {
      setHashing(false);
    }
  }

  function resetForm() {
    setVersion("");
    setFile(null);
    setSha256("");
    setChangelogNotes("");
    setProgress(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!productId) return toast("Pilih product terlebih dahulu.", "error");
    if (!version.trim()) return toast("Version wajib diisi.", "error");
    if (!file) return toast("Pilih file installer.", "error");
    if (!SHA256_RE.test(sha256.trim())) return toast("sha256 wajib 64 karakter hex.", "error");

    const contentType = file.type || "application/octet-stream";

    try {
      setStage("presign");
      const presignRes = await fetch("/api/admin/installers/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, platform, filename: file.name, contentType }),
      });
      const presignData = await presignRes.json().catch(() => ({}));
      if (!presignRes.ok) throw new Error(presignData.error || "Gagal membuat presigned URL.");

      setStage("upload");
      setProgress(0);
      await putWithProgress(presignData.uploadUrl, file, contentType, setProgress);

      setStage("save");
      await addInstaller({
        productId,
        version: version.trim(),
        platform,
        fileUrl: presignData.publicUrl,
        fileSize: file.size,
        sha256: sha256.trim(),
        changelogNotes: changelogNotes.trim() || undefined,
      });

      toast("Release berhasil dipublikasikan.", "success");
      resetForm();
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Gagal mempublikasikan release.", "error");
    } finally {
      setStage(null);
    }
  }

  const stageLabel =
    stage === "presign" ? "Menyiapkan upload…"
    : stage === "upload" ? `Mengunggah ke R2… ${progress}%`
    : stage === "save" ? "Menyimpan metadata…"
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Select
        id="productId"
        label="Product"
        required
        value={productId}
        onChange={(e) => setProductId(e.target.value)}
        disabled={busy}
      >
        {products.length === 0 && <option value="">No products</option>}
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </Select>

      <Input
        id="version"
        label="Version"
        placeholder="2.1.0"
        required
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        disabled={busy}
      />

      <Select
        id="platform"
        label="Platform"
        required
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        disabled={busy}
      >
        <option value="WINDOWS">Windows</option>
        <option value="MAC">macOS</option>
        <option value="LINUX">Linux</option>
      </Select>

      <div className="space-y-1.5">
        <label htmlFor="file" className="block text-[12px] font-medium text-fg">
          Installer file
        </label>
        <input
          ref={fileRef}
          id="file"
          type="file"
          disabled={busy}
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          className="block w-full text-[12px] text-fg-sub file:mr-3 file:rounded-btn file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[12px] file:font-semibold file:text-bg hover:file:bg-accent-hover disabled:opacity-50"
        />
        {file && <p className="text-[11px] text-fg-muted">{(file.size / (1024 * 1024)).toFixed(1)} MB — diupload langsung ke R2, tidak lewat server.</p>}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="sha256" className="block text-[12px] font-medium text-fg">
            sha256 {hashing && <span className="text-fg-muted">(menghitung…)</span>}
          </label>
        </div>
        <Input
          id="sha256"
          placeholder="64 karakter hex — otomatis terisi dari file, atau tempel dari output build"
          required
          value={sha256}
          onChange={(e) => setSha256(e.target.value.trim())}
          disabled={busy}
          className="font-mono text-[12px]"
        />
        {sha256 && !SHA256_RE.test(sha256) && (
          <p className="text-[11px] text-danger">Harus 64 karakter hex.</p>
        )}
      </div>

      <Textarea
        id="changelogNotes"
        label="Changelog (opsional)"
        placeholder="Ringkasan perubahan untuk versi ini"
        rows={3}
        value={changelogNotes}
        onChange={(e) => setChangelogNotes(e.target.value)}
        disabled={busy}
      />

      <button
        type="submit"
        disabled={busy}
        className="flex h-10 w-full items-center justify-center gap-1.5 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
      >
        {busy ? <Spinner className="h-4 w-4" /> : <Icon name="upload" size={13} />}
        {stageLabel ?? "Publish installer"}
      </button>
    </form>
  );
}
