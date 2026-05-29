"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { Icon } from "@/components/ui/Icon";
import { ProductMentionInput } from "@/components/community/ProductMentionInput";

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
  const [authorName, setAuthorName] = useState("");
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
    if (authorName.trim().length < 2) { setError("Name must be at least 2 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/community/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          authorName: authorName.trim(),
          category,
          productIds: mentions.map((p) => p.id),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to post. Try again.");
        return;
      }
      const topic = await res.json();
      onClose();
      setTitle(""); setBody(""); setAuthorName(""); setMentions([]); setCategory("General");
      router.push(`/community/${topic.id}`);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Start a New Discussion" subtitle="Share your thoughts, questions, or feedback with the community.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input id="anon-name" label="Your Name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Anonymous or your name" required />
        <Select id="category" label="Category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Input id="topic-title" label="Topic Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What's on your mind?" required />
        <Textarea id="topic-body" label="Description" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Describe your topic in detail…" rows={5} required />
        <ProductMentionInput selected={mentions} onChange={setMentions} />
        {error && <p className="text-[12px] text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60"
        >
          {loading ? "Posting…" : <><Icon name="send" size={14} /> Post Discussion</>}
        </button>
      </form>
    </Modal>
  );
}
