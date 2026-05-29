// Admin pages depend on auth cookies and live DB data — never prerender them.
export const dynamic = "force-dynamic";

export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
