"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function Modal({ open, onClose, title, subtitle, children, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-card border border-line bg-card p-6 shadow-card-lg",
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded text-fg-muted hover:bg-card-hover hover:text-fg"
        >
          <Icon name="x" size={14} />
        </button>
        {title && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-fg">{title}</h2>
            {subtitle && <p className="mt-1 text-[13px] text-fg-sub">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
