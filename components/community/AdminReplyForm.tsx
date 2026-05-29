"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";

export function AdminReplyForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [secret, setSecret] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Show only when admin marker is in localStorage (Step 7)
  useEffect(() => {
    const isAdmin = localStorage.getItem("kaemnur_admin") === "true";
    const storedSecret = localStorage.getItem("kaemnur_admin_secret") || "";
    if (isAdmin) {
      setVisible(true);
      setSecret(storedSecret);
    }
  }, []);

  if (!visible) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (!body.trim()) { setError("Reply cannot be empty."); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/community/topics/${topicId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          authorName: "Kaemnur Team",
          adminSecret: secret,
        }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || "Failed to post."); return; }
      if (!d.isAdmin) { setError("Session expired. Please log in to /admin again."); return; }
      setBody(""); setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-card border-l-2 border-accent bg-[#1A1200] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded bg-accent text-[11px] font-bold text-bg">K</span>
        <span className="rounded bg-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
          Kaemnur Team
        </span>
        <span className="text-[11px] text-fg-sub">Admin reply</span>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea id="admin-body" label="" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Reply as Kaemnur Team…" rows={3} required />
        {error && <p className="text-[12px] text-danger">{error}</p>}
        {success && <p className="text-[12px] text-success">Admin reply posted!</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-btn bg-accent px-4 text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Posting…" : <><Icon name="send" size={13} /> Post as Admin</>}
          </button>
        </div>
      </form>
    </div>
  );
}
