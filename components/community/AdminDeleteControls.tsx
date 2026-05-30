"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

// Shown only when localStorage.kaemnur_admin === "true"
// (set by AdminMarker in the admin layout).

// topicId is kept in the signature for future use (e.g. navigating back to the topic after delete)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AdminDeleteComment({ commentId, topicId }: { commentId: string; topicId: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem("kaemnur_admin") === "true");
  }, []);

  if (!visible) return null;

  async function handleDelete() {
    if (!confirm("Delete this comment? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/community/comments/${commentId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to delete comment.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex h-6 items-center gap-1 rounded px-1.5 text-[10px] font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
    >
      <Icon name="trash" size={11} />
      {deleting ? "…" : "Delete"}
    </button>
  );
}

export function AdminDeleteTopic({ topicId }: { topicId: string }) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem("kaemnur_admin") === "true");
  }, []);

  if (!visible) return null;

  async function handleDelete() {
    if (!confirm("Delete this topic and all its comments? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/admin/community/topics/${topicId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.push("/community");
      router.refresh();
    } else {
      alert("Failed to delete topic.");
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex h-7 items-center gap-1.5 rounded-btn border border-danger/40 px-2 text-[11px] font-medium text-danger hover:bg-danger/10 disabled:opacity-60"
    >
      <Icon name="trash" size={12} />
      {deleting ? "Deleting…" : "Delete Topic"}
    </button>
  );
}
