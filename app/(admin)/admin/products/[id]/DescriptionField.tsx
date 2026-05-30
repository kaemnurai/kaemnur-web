"use client";

import { useState } from "react";

export function DescriptionField({ defaultValue }: { defaultValue: string }) {
  const [len, setLen] = useState(defaultValue.length);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor="description" className="text-[12px] font-medium text-fg-sub">
          Description
        </label>
        <span className="text-[11px] text-fg-muted">{len}/2000</span>
      </div>
      <textarea
        id="description"
        name="description"
        required
        maxLength={2000}
        defaultValue={defaultValue}
        onChange={(e) => setLen(e.target.value.length)}
        rows={9}
        className="w-full rounded-btn border border-line bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
    </div>
  );
}
