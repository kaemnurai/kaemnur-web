"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { assignLicenseUser } from "@/app/(admin)/admin/actions";

type Props = {
  licenseId: string;
  linkedEmail: string | null;
};

// Compact cell for linking a license to a user account by email.
export function LicenseAssign({ licenseId, linkedEmail }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(unlink = false) {
    setError(null);
    const form = new FormData();
    form.set("id", licenseId);
    form.set("email", unlink ? "" : email.trim());
    startTransition(async () => {
      try {
        await assignLicenseUser(form);
        setEditing(false);
        setEmail("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Gagal menautkan akun.");
      }
    });
  }

  if (linkedEmail && !editing) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
          <Icon name="users" size={11} />
          <span className="max-w-[140px] truncate">{linkedEmail}</span>
        </span>
        <button
          type="button"
          onClick={() => submit(true)}
          disabled={pending}
          title="Lepas tautan akun"
          className="text-fg-muted hover:text-danger disabled:opacity-50"
        >
          <Icon name="x" size={12} />
        </button>
      </div>
    );
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium text-fg-sub hover:bg-card-hover hover:text-fg"
      >
        <Icon name="plus" size={11} />
        Tautkan akun
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="email@akun.com"
          autoFocus
          className="h-7 w-[150px] rounded border border-line bg-bg px-2 text-[11px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={pending || !email.trim()}
          className="h-7 rounded bg-accent px-2 text-[11px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "…" : "Link"}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setError(null); }}
          className="text-fg-muted hover:text-fg"
        >
          <Icon name="x" size={12} />
        </button>
      </div>
      {error && <p className="text-[10px] text-danger">{error}</p>}
    </div>
  );
}
