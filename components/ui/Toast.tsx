"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

// Tiny dependency-free toast. `toast()` dispatches a window CustomEvent that the
// mounted <Toaster/> listens for — no context/provider plumbing required.

export type ToastType = "success" | "error" | "info";
type ToastPayload = { id: number; message: string; type: ToastType };

const EVENT = "kaemnur:toast";

export function toast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(EVENT, {
      detail: { id: Date.now() + Math.random(), message, type },
    })
  );
}

const STYLES: Record<ToastType, { box: string; icon: React.ComponentProps<typeof Icon>["name"] }> = {
  success: { box: "border-success/40 bg-success/15 text-success", icon: "check" },
  error: { box: "border-danger/40 bg-danger/15 text-danger", icon: "alert-triangle" },
  info: { box: "border-line bg-card text-fg", icon: "bell" },
};

export function Toaster() {
  const [items, setItems] = useState<ToastPayload[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      setItems((cur) => [...cur, detail]);
      setTimeout(() => {
        setItems((cur) => cur.filter((t) => t.id !== detail.id));
      }, 3500);
    }
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {items.map((t) => {
        const s = STYLES[t.type];
        return (
          <div
            key={t.id}
            className={
              "pointer-events-auto flex items-center gap-2.5 rounded-card border px-4 py-3 text-[13px] font-medium shadow-card-lg " +
              s.box
            }
          >
            <Icon name={s.icon} size={16} className="shrink-0" />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
