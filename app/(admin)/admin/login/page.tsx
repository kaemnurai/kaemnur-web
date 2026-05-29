import Image from "next/image";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/auth";
import { Input } from "@/components/ui/Input";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  if (isAdminAuthed()) redirect("/admin");

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-card border border-line bg-card p-8 shadow-card-lg">
        <div className="mb-6 flex items-center gap-2">
          <Image
            src="/logo-dark.png"
            alt=""
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
          />
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold tracking-tight text-fg">Kaemnur</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
              Admin
            </span>
          </div>
        </div>
        <h1 className="mb-1 text-lg font-bold text-fg">Sign in</h1>
        <p className="mb-5 text-[13px] text-fg-sub">
          Enter your admin credentials to manage the catalog.
        </p>
        <form action="/api/admin/login" method="post" className="space-y-4">
          <Input
            id="username"
            name="username"
            type="text"
            label="Username"
            placeholder="Enter username"
            autoComplete="username"
            autoFocus
            required
          />
          <Input
            id="password"
            name="password"
            type="password"
            label="Password"
            placeholder="Enter password"
            autoComplete="current-password"
            required
          />
          {searchParams.error && (
            <p className="text-[12px] text-danger">Incorrect username or password. Try again.</p>
          )}
          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover"
          >
            Log in
          </button>
        </form>
      </div>
    </div>
  );
}
