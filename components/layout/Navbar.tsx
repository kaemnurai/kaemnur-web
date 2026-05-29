"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type SearchResult = {
  name: string;
  slug: string;
  category: string;
  priceFree: boolean;
  priceLabel: string | null;
  screenshots: { url: string }[];
};

const tabs = [
  { href: "/", label: "Store" },
  { href: "/download", label: "Library" },
  { href: "/community", label: "Community" },
  { href: "/faq", label: "News" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // ── Search state ─────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const data: SearchResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Close on outside click or Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
      // ⌘K / Ctrl+K focus the search input
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        (wrapRef.current?.querySelector("input") as HTMLInputElement | null)?.focus();
      }
    }
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, []);

  function handleSelect(slug: string) {
    setOpen(false);
    setQuery("");
    router.push(`/products/${slug}`);
  }

  return (
    <header className="sticky top-0 z-40 h-12 border-b border-line bg-sidebar">
      <div className="flex h-full items-center gap-6 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 pr-2 text-fg" aria-label="Kaemnur home">
          <Image src="/logo-dark.png" alt="" width={28} height={28} priority className="h-7 w-7 object-contain" />
          <span className="text-[15px] font-bold tracking-tight">Kaemnur</span>
        </Link>

        {/* Center tabs */}
        <nav className="flex items-center gap-6">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={cn("text-[14px] font-medium transition-colors", isActive(t.href) ? "text-fg" : "text-fg-sub hover:text-fg")}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="relative ml-2 hidden flex-1 max-w-md md:block" ref={wrapRef}>
          <label className="flex h-9 items-center gap-2 rounded-btn border border-line bg-bg px-3 text-[13px] text-fg-sub focus-within:border-accent/60">
            <Icon name="search" size={14} className="shrink-0 text-fg-muted" />
            <input
              type="search"
              placeholder="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none placeholder:text-fg-muted"
            />
            {loading ? (
              <span className="kbd opacity-60">…</span>
            ) : (
              <span className="kbd">⌘K</span>
            )}
          </label>

          {/* Dropdown */}
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-btn border border-line bg-card shadow-card-lg">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-[13px] text-fg-sub">No results for &quot;{query}&quot;</p>
              ) : (
                <ul>
                  {results.map((r) => (
                    <li key={r.slug}>
                      <button
                        type="button"
                        onClick={() => handleSelect(r.slug)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-card-hover"
                      >
                        {r.screenshots[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.screenshots[0].url} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                        ) : (
                          <span className="grid h-8 w-12 shrink-0 place-items-center rounded bg-bg text-[11px] font-bold text-fg-muted">
                            {r.name[0]}
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-fg">{r.name}</p>
                          <p className="truncate text-[11px] text-fg-sub">{r.category}</p>
                        </div>
                        <div className="shrink-0 text-[11px] font-semibold">
                          {r.priceFree && <span className="text-success">Free</span>}
                          {r.priceLabel && <span className="ml-1 text-accent">PRO</span>}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-3">
          <button type="button" className="grid h-9 w-9 place-items-center rounded-btn text-fg-sub hover:bg-card hover:text-fg" aria-label="Notifications">
            <Icon name="bell" size={16} />
          </button>
          <Link href="/admin/login" className="flex items-center gap-2 rounded-btn pr-2 pl-1 hover:bg-card">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[12px] font-bold text-bg">A</span>
            <span className="text-[13px] font-medium text-fg-sub">Admin</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
