// Server component: reusable admin top bar with eyebrow, title, subtitle, and
// right-aligned action slots. Each admin page provides its own copy + actions.

export function AdminTopBar({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-line px-6 py-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-[24px] font-bold leading-tight text-fg">{title}</h1>
        {subtitle && <p className="mt-1 text-[13px] text-fg-sub">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
