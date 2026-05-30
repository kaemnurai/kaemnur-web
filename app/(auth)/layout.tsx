// Auth pages (login/signup) use a minimal layout: just dark background.
// They do NOT need the public navbar/sidebar.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
