// Lightweight, coded UI mockups used as preview placeholders for categories
// that don't have a real screenshot asset yet. Pure CSS/Tailwind — no images,
// so the showcase grid always looks full and intentional (never a broken img).

export type MockVariant = "site" | "dashboard" | "desktop";

function Chrome({ tone }: { tone: string }) {
  return (
    <div className="flex items-center gap-1.5 border-b border-cw-line/70 bg-cw-bg-soft px-3 py-2">
      <span className="h-2 w-2 rounded-full bg-cw-orange/70" />
      <span className="h-2 w-2 rounded-full bg-cw-line" />
      <span className="h-2 w-2 rounded-full bg-cw-line" />
      <span className={`ml-2 h-2.5 w-24 rounded-full ${tone}`} />
    </div>
  );
}

function SiteMock() {
  return (
    <div className="flex h-full flex-col">
      <Chrome tone="bg-cw-navy/15" />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="h-3 w-1/2 rounded bg-cw-navy/25" />
        <div className="h-2 w-2/3 rounded bg-cw-line" />
        <div className="mt-2 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5 rounded-md border border-cw-line bg-cw-bg-soft p-2">
              <div className="h-8 rounded bg-cw-navy/10" />
              <div className="h-1.5 w-3/4 rounded bg-cw-line" />
              <div className="h-1.5 w-1/2 rounded bg-cw-line" />
            </div>
          ))}
        </div>
        <div className="mt-auto h-6 w-24 rounded bg-cw-orange/70" />
      </div>
    </div>
  );
}

function DashboardMock() {
  return (
    <div className="flex h-full">
      <div className="hidden w-1/5 flex-col gap-2 bg-cw-bg-soft p-2.5 sm:flex">
        <div className="h-2.5 w-3/4 rounded bg-cw-navy/30" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-2 w-full rounded bg-cw-line" />
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <Chrome tone="bg-cw-navy/15" />
        <div className="flex-1 space-y-2.5 p-3">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-md border border-cw-line bg-cw-bg-soft p-2">
                <div className="h-1.5 w-1/2 rounded bg-cw-line" />
                <div className="mt-1.5 h-3 w-2/3 rounded bg-cw-navy/30" />
              </div>
            ))}
          </div>
          <div className="rounded-md border border-cw-line bg-cw-bg-soft p-2.5">
            <div className="flex items-end gap-1.5">
              {[40, 65, 50, 80, 55, 70].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-cw-navy/25" style={{ height: `${h * 0.5}px` }} />
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cw-orange/70" />
                <div className="h-2 flex-1 rounded bg-cw-line" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopMock() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-cw-line/70 bg-cw-navy/[0.06] px-3 py-2">
        <div className="h-2.5 w-28 rounded-full bg-cw-navy/25" />
        <div className="flex gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-cw-line" />
          <span className="h-2 w-2 rounded-sm bg-cw-line" />
          <span className="h-2 w-2 rounded-sm bg-cw-orange/70" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex gap-1.5">
          <div className="h-5 w-14 rounded bg-cw-navy/15" />
          <div className="h-5 w-14 rounded bg-cw-bg-soft" />
          <div className="h-5 w-14 rounded bg-cw-bg-soft" />
        </div>
        <div className="grid flex-1 grid-cols-4 gap-1.5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded border border-cw-line bg-cw-bg-soft" />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div className="h-2 w-20 rounded bg-cw-line" />
          <div className="h-6 w-20 rounded bg-cw-green/70" />
        </div>
      </div>
    </div>
  );
}

export function MockPreview({
  variant,
  className = "",
}: {
  variant: MockVariant;
  className?: string;
}) {
  return (
    <div className={`h-full w-full overflow-hidden bg-cw-card ${className}`}>
      {variant === "site" && <SiteMock />}
      {variant === "dashboard" && <DashboardMock />}
      {variant === "desktop" && <DesktopMock />}
    </div>
  );
}
