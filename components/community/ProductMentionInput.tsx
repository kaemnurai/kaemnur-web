"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

type Product = { id: string; name: string; slug: string };

type Props = {
  selected: Product[];
  onChange: (products: Product[]) => void;
};

export function ProductMentionInput({ selected, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) { setResults([]); setOpen(false); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.filter((p: Product) => !selected.some((s) => s.id === p.id)));
      setOpen(true);
    }, 250);
    return () => clearTimeout(t);
  }, [query, selected]);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function addProduct(p: Product) {
    onChange([...selected, p]);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  function removeProduct(id: string) {
    onChange(selected.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-2">
      <label className="block text-[12px] font-medium text-fg">
        Mention Products <span className="text-fg-muted">(optional)</span>
      </label>

      {/* Selected badges */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((p) => (
            <span key={p.id} className="inline-flex items-center gap-1 rounded bg-accent/15 px-2 py-0.5 text-[12px] font-semibold text-accent">
              @{p.name}
              <button type="button" onClick={() => removeProduct(p.id)} className="text-accent/60 hover:text-accent">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative" ref={wrapRef}>
        <div className="flex items-center gap-2 rounded-btn border border-line bg-bg px-3 py-2">
          <Icon name="at-sign" size={14} className="text-fg-muted" />
          <input
            type="text"
            placeholder="Search products to mention…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-[13px] text-fg outline-none placeholder:text-fg-muted"
          />
        </div>
        {open && results.length > 0 && (
          <ul className="absolute left-0 top-full z-50 mt-1 w-full overflow-hidden rounded-btn border border-line bg-card shadow-card-lg">
            {results.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => addProduct(p)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-card-hover"
                >
                  <span className="text-[12px] font-semibold text-accent">@{p.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {open && query && results.length === 0 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-btn border border-line bg-card px-3 py-2 text-[12px] text-fg-sub shadow-card-lg">
            No products found
          </div>
        )}
      </div>
    </div>
  );
}
