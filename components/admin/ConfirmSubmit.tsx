"use client";

import { cn } from "@/lib/utils";

type Props = {
  confirm?: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
};

/** Submit button for server-action forms with an optional confirm dialog. */
export function ConfirmSubmit({ confirm, className, title, children }: Props) {
  return (
    <button
      type="submit"
      title={title}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-btn transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}
