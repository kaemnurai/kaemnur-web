"use client";

import { cn } from "@/lib/utils";

type Props = {
  confirm?: string;
  className?: string;
  children: React.ReactNode;
};

/** Submit button for server-action forms with an optional confirm dialog. */
export function ConfirmSubmit({ confirm, className, children }: Props) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-btn px-3 py-1.5 text-[12px] font-medium transition-colors",
        className
      )}
    >
      {children}
    </button>
  );
}
