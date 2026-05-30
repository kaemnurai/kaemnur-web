"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

// Avatar + name + dropdown shown on the right of the admin top navbar.
export function AdminUserMenu({ name = "Admin" }: { name?: string }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-btn px-1.5 py-1 hover:bg-card"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-[13px] font-bold text-bg">
          {name[0]?.toUpperCase() ?? "A"}
        </span>
        <span className="hidden text-[13px] font-medium text-fg sm:block">{name}</span>
        <Icon name="chevron-down" size={14} className="text-fg-muted" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-card border border-line bg-card shadow-card-lg">
          <div className="border-b border-line px-3 py-2.5">
            <p className="text-[13px] font-semibold text-fg">{name}</p>
            <p className="text-[11px] text-fg-sub">Administrator</p>
          </div>
          <div className="py-1 text-[13px]">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-fg-sub hover:bg-card-hover hover:text-fg"
            >
              <Icon name="arrow-left" size={14} />
              Back to site
            </Link>
            <form action="/api/admin/logout" method="post">
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-danger hover:bg-danger/10"
              >
                <Icon name="log-out" size={14} />
                Log out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
