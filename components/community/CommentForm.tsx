"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input, Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ProductMentionInput } from "@/components/community/ProductMentionInput";

type Product = { id: string; name: string; slug: string };

export function CommentForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (authorName.trim().length < 2) { setError("Name must be at least 2 characters."); return; }
    if (!body.trim()) { setError("Comment cannot be empty."); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/community/topics/${topicId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          authorName: authorName.trim(),
          productIds: mentions.map((p) => p.id),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to post. Try again.");
        return;
      }
      setBody(""); setMentions([]); setSuccess(true);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-card border border-line bg-card p-4">
      <h3 className="mb-4 text-[14px] font-semibold text-fg">Join the discussion</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input id="c-name" label="Your Name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Anonymous or your name" required />
        <ProductMentionInput selected={mentions} onChange={setMentions} />
        <Textarea id="c-body" label="Comment" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add to the discussion…" rows={4} required />
        {error && <p className="text-[12px] text-danger">{error}</p>}
        {success && <p className="text-[12px] text-success">Reply posted!</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-9 items-center gap-2 rounded-btn bg-accent px-4 text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
          >
            {loading ? "Posting…" : <><Icon name="send" size={13} /> Post Reply</>}
          </button>
        </div>
      </form>
    </div>
  );
}
