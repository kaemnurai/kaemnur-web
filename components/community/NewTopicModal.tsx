"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Textarea, Select } from "@/components/ui/Input";
import { Input } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ProductMentionInput } from "@/components/community/ProductMentionInput";
import { createClient } from "@/lib/supabase/client";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";

type Product = { id: string; name: string; slug: string };

const CATEGORIES = ["General", "Questions", "Bug Reports", "Suggestions"];

export function NewTopicModal({
  open,
  onClose,
  preselectedProduct,
}: {
  open: boolean;
  onClose: () => void;
  preselectedProduct?: Product;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch current user on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setDisplayName(
          user.user_metadata?.display_name ??
          user.user_metadata?.full_name ??
          user.email?.split("@")[0] ??
          "You"
        );
        setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [category, setCategory] = useState("General");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState<Product[]>(preselectedProduct ? [preselectedProduct] : []);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (title.trim().length < 5) { setError("Title must be at least 5 characters."); return; }
    if (body.trim().length < 10) { setError("Description must be at least 10 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/community/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          // authorName sent for backward compat; server prefers session user
          authorName: displayName ?? "Anonymous",
          category,
          productIds: mentions.map((p) => p.id),
          userId,
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to post."); return; }
      const topic = await res.json();
      onClose();
      setTitle(""); setBody(""); setMentions([]); setCategory("General"); setError("");
      router.push(`/community/${topic.id}`);
      router.refresh();
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  const avatarBg = userId ? getAvatarColor(userId) : "#F4B400";
  const avatarFg = getAvatarTextColor(avatarBg);

  return (
    <Modal open={open} onClose={onClose} title="Start a New Discussion" subtitle="Share your thoughts, questions, or feedback with the community.">
      {/* Posting as */}
      {displayName && (
        <div className="mb-4 flex items-center gap-2 rounded-btn border border-line bg-bg px-3 py-2 text-[12px] text-fg-sub">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
          ) : (
            <span className="grid h-6 w-6 place-items-center rounded text-[10px] font-bold" style={{ backgroundColor: avatarBg, color: avatarFg }}>
              {getInitial(displayName)}
            </span>
          )}
          Posting as <span className="font-semibold text-fg">{displayName}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Select id="category" label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input id="topic-title" label="Topic Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's on your mind?" required />
        <Textarea id="topic-body" label="Description" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your topic in detail…" rows={5} required />
        <ProductMentionInput selected={mentions} onChange={setMentions} />
        {error && <p className="text-[12px] text-danger">{error}</p>}
        <button type="submit" disabled={loading} className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60">
          {loading ? "Posting…" : <><Icon name="send" size={14} /> Post Discussion</>}
        </button>
      </form>
    </Modal>
  );
}
