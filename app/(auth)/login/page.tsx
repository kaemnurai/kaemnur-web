"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";

// Inner component uses useSearchParams — must be inside <Suspense>
function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const supabase = createClient();

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Email atau password salah.");
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm rounded-card border border-line bg-card p-8 shadow-card-lg">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image src="/logo-dark.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          <h1 className="text-[20px] font-bold text-fg">Sign in to Kaemnur</h1>
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-btn border border-line bg-card text-[13px] font-semibold text-fg hover:bg-card-hover disabled:opacity-60"
        >
          {/* Simple Google G SVG */}
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {googleLoading ? "Mengarahkan…" : "Continue with Google"}
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-line" />
          <span className="text-[12px] text-fg-muted">or</span>
          <div className="flex-1 border-t border-line" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <Input id="email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input id="password" type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          {error && <p className="text-[12px] text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="flex h-10 w-full items-center justify-center rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60">
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-fg-sub">
          Don&apos;t have an account?{" "}
          <Link href={`/signup?redirect=${encodeURIComponent(redirectTo)}`} className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-bg" />}>
      <LoginContent />
    </Suspense>
  );
}
