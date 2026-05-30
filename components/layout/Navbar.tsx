"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";
import { getAvatarColor, getAvatarTextColor, getInitial } from "@/lib/avatar";
import type { User } from "@supabase/supabase-js";

type SearchResult = {
  name: string;
  slug: string;
  category: string;
  priceFree: boolean;
  priceLabel: string | null;
  screenshots: { url: string }[];
};

type UserMeta = {
  displayName: string | null;
  avatarUrl: string | null;
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
  const supabase = createClient();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  // ── Auth state ────────────────────────────────────────────────────────
  const [user, setUser] = useState<User | null>(null);
  const [userMeta, setUserMeta] = useState<UserMeta>({ displayName: null, avatarUrl: null });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
      if (user) {
        setUserMeta({
          displayName:
            user.user_metadata?.display_name ??
            user.user_metadata?.full_name ??
            user.email?.split("@")[0] ??
            null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        setUserMeta({
          displayName:
            u.user_metadata?.display_name ??
            u.user_metadata?.full_name ??
            u.email?.split("@")[0] ??
            null,
          avatarUrl: u.user_metadata?.avatar_url ?? null,
        });
      } else {
        setUserMeta({ displayName: null, avatarUrl: null });
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    setUserMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  // Close user menu on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ── Search state ─────────────────────────────────────────────────────
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
        const data: SearchResult[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch { setResults([]); } finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        (wrapRef.current?.querySelector("input") as HTMLInputElement | null)?.focus();
      }
    }
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onOutside);
    };
  }, []);

  const displayName = userMeta.displayName;
  const avatarBg = user ? getAvatarColor(user.id) : "#F4B400";
  const avatarFg = getAvatarTextColor(avatarBg);
  const initial = displayName ? getInitial(displayName) : "?";

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
            <Link key={t.href} href={t.href} className={cn("text-[14px] font-medium transition-colors", isActive(t.href) ? "text-fg" : "text-fg-sub hover:text-fg")}>
              {t.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div className="relative ml-2 hidden flex-1 max-w-md md:block" ref={wrapRef}>
          <label className="flex h-9 items-center gap-2 rounded-btn border border-line bg-bg px-3 text-[13px] text-fg-sub focus-within:border-accent/60">
            <Icon name="search" size={14} className="shrink-0 text-fg-muted" />
            <input type="search" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 bg-transparent outline-none placeholder:text-fg-muted" />
            {loading ? <span className="kbd opacity-60">…</span> : <span className="kbd">⌘K</span>}
          </label>
          {open && (
            <div className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-btn border border-line bg-card shadow-card-lg">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-[13px] text-fg-sub">No results for &quot;{query}&quot;</p>
              ) : (
                <ul>
                  {results.map((r) => (
                    <li key={r.slug}>
                      <button type="button" onClick={() => { setOpen(false); setQuery(""); router.push(`/products/${r.slug}`); }} className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-card-hover">
                        {r.screenshots[0]?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.screenshots[0].url} alt="" className="h-8 w-12 shrink-0 rounded object-cover" />
                        ) : (
                          <span className="grid h-8 w-12 shrink-0 place-items-center rounded bg-bg text-[11px] font-bold text-fg-muted">{r.name[0]}</span>
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
        <div className="ml-auto flex items-center gap-2">
          {user ? (
            /* Logged-in user dropdown */
            <div className="relative" ref={userMenuRef}>
              <button type="button" onClick={() => setUserMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-btn py-1 pl-1 pr-2 hover:bg-card">
                {userMeta.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={userMeta.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full text-[12px] font-bold" style={{ backgroundColor: avatarBg, color: avatarFg }}>
                    {initial}
                  </span>
                )}
                <span className="max-w-[80px] truncate text-[13px] font-medium text-fg-sub">
                  {displayName ?? "You"}
                </span>
                <Icon name="chevron-down" size={12} className="text-fg-muted" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-card border border-line bg-card shadow-card-lg">
                  <div className="border-b border-line px-3 py-2.5">
                    <p className="truncate text-[12px] font-semibold text-fg">{displayName ?? "User"}</p>
                    <p className="truncate text-[11px] text-fg-muted">{user.email}</p>
                  </div>
                  <ul className="py-1 text-[13px]">
                    <li><Link href="/downloads" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 text-fg-sub hover:bg-card-hover hover:text-fg"><Icon name="download" size={13} />My Downloads</Link></li>
                    <li className="border-t border-line mt-1 pt-1">
                      <button type="button" onClick={signOut} className="flex w-full items-center gap-2 px-3 py-2 text-danger hover:bg-danger/10">
                        <Icon name="log-out" size={13} />Sign out
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ) : (
            /* Not logged in */
            <>
              <Link href="/login" className="h-9 rounded-btn border border-line px-3 text-[13px] font-medium leading-9 text-fg-sub hover:border-fg-muted hover:text-fg">
                Sign in
              </Link>
              <Link href="/signup" className="h-9 rounded-btn bg-accent px-3 text-[13px] font-semibold leading-9 text-bg hover:bg-accent-hover">
                Sign up
              </Link>
            </>
          )}
          {/* Admin quick link (always visible) */}
          <Link href="/admin" className="ml-1 grid h-7 w-7 place-items-center rounded-btn text-fg-muted hover:bg-card hover:text-fg" title="Admin">
            <Icon name="layout-dashboard" size={14} />
          </Link>
        </div>
      </div>
    </header>
  );
}
