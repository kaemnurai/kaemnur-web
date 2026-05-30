"use client";

import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/Icon";

export type ProductTab = {
  key: string;
  label: string;
  icon: IconName;
  content: ReactNode;
};

export function ProductTabs({ tabs }: { tabs: ProductTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-line px-6">
        {tabs.map((t) => {
          const on = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(t.key)}
              className={
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-[13px] font-medium transition-colors " +
                (on
                  ? "border-accent text-fg"
                  : "border-transparent text-fg-sub hover:text-fg")
              }
            >
              <Icon name={t.icon} size={15} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {tabs.map((t) => (
          <div key={t.key} className={active === t.key ? "" : "hidden"}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
