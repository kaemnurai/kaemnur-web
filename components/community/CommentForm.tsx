"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ProductMentionInput } from "@/components/community/ProductMentionInput";
import { createClient } from "@/lib/supabase/client";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";

type Product = { id: string; name: string; slug: string };

export function CommentForm({ topicId }: { topicId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setDisplayName(
          user.user_metadata?.display_name ??
          user.user_metadata?.full_name ??
          user.email?.split("@")[0] ??
          "User"
        );
        setAvatarUrl(user.user_metadata?.avatar_url ?? null);
      }
      setAuthLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [body, setBody] = useState("");
  const [mentions, setMentions] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (!body.trim()) { setError("Comment cannot be empty."); return; }

    setLoading(true);
    try {
      const res = await fetch(`/api/community/topics/${topicId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          authorName: displayName ?? "User",
          userId,
          productIds: mentions.map((p) => p.id),
        }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || "Failed to post."); return; }
      setBody(""); setMentions([]); setSuccess(true);
      router.refresh();
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  }

  if (authLoading) return null;

  // Not logged in — show prompt
  if (!userId) {
    return (
      <div className="rounded-card border border-line bg-card p-5 text-center">
        <p className="mb-3 text-[14px] font-semibold text-fg">Sign in to join the discussion</p>
        <p className="mb-4 text-[13px] text-fg-sub">You need an account to post comments.</p>
        <a
          href={`/login?redirect=/community/${topicId}`}
          className="inline-flex h-9 items-center gap-2 rounded-btn bg-accent px-4 text-[13px] font-semibold text-bg hover:bg-accent-hover"
        >
          <Icon name="lock" size={14} />
          Sign in to comment
        </a>
      </div>
    );
  }

  const avatarBg = getAvatarColor(userId);
  const avatarFg = getAvatarTextColor(avatarBg);

  return (
    <div className="rounded-card border border-line bg-card p-4">
      <h3 className="mb-3 text-[14px] font-semibold text-fg">Join the discussion</h3>

      {/* Posting as indicator */}
      <div className="mb-3 flex items-center gap-2 rounded-btn border border-line bg-bg px-3 py-2 text-[12px] text-fg-sub">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <span className="grid h-5 w-5 place-items-center rounded text-[9px] font-bold" style={{ backgroundColor: avatarBg, color: avatarFg }}>
            {displayName ? getInitial(displayName) : "?"}
          </span>
        )}
        Posting as <span className="font-semibold text-fg">{displayName}</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <ProductMentionInput selected={mentions} onChange={setMentions} />
        <Textarea id="c-body" label="Comment" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add to the discussion…" rows={4} required />
        {error && <p className="text-[12px] text-danger">{error}</p>}
        {success && <p className="text-[12px] text-success">Reply posted!</p>}
        <div className="flex justify-end">
          <button type="submit" disabled={loading} className="inline-flex h-9 items-center gap-2 rounded-btn bg-accent px-4 text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60">
            {loading ? "Posting…" : <><Icon name="send" size={13} /> Post Reply</>}
          </button>
        </div>
      </form>
    </div>
  );
}
