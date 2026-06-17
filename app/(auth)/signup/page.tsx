"use client";

import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/Input";
import { getAuthRedirectPath } from "@/lib/auth-redirect";

// Google SVG shared between form and success states
const GoogleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

function SignupContent() {
  const params = useSearchParams();
  const redirectTo = getAuthRedirectPath(params);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Password harus minimal 8 karakter."); return; }
    setLoading(true);

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName.trim() || email.split("@")[0] },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`,
      },
    });
    setLoading(false);

    if (signupError) {
      setError(signupError.message);
      return;
    }

    // Email confirmation is required (session is null) — show success card.
    // If Supabase has email confirm disabled, data.session will be set and we
    // can proceed directly (rare in production).
    if (data.session) {
      // Auto-confirmed — redirect immediately
      window.location.href = redirectTo;
    } else {
      setSuccess(true);
    }
  }

  async function handleResend() {
    setResendStatus("sending");
    await supabase.auth.resend({ type: "signup", email });
    setResendStatus("sent");
    // Reset after 5 s so user can resend again if needed
    setTimeout(() => setResendStatus("idle"), 5000);
  }

  // ── Success state ────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="grid min-h-screen place-items-center bg-bg px-4 py-12">
        <div className="w-full max-w-sm rounded-card border border-line bg-card p-8 shadow-card-lg">
          {/* Icon */}
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-accent/15">
            <span className="text-[36px] leading-none">🎉</span>
          </div>

          <h1 className="text-center text-[20px] font-bold text-fg">
            Pendaftaran Berhasil!
          </h1>

          <p className="mt-3 text-center text-[13px] leading-relaxed text-fg-sub">
            Kami telah mengirimkan email konfirmasi ke{" "}
            <span className="font-semibold text-fg">{email}</span>.{" "}
            Silakan cek inbox atau folder spam Anda, lalu klik link konfirmasi
            untuk mengaktifkan akun.
          </p>

          <Link
            href={`/login?redirect=${encodeURIComponent(redirectTo)}`}
            className="mt-6 flex h-10 w-full items-center justify-center rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover"
          >
            Kembali ke Halaman Login
          </Link>

          <div className="mt-4 text-center">
            {resendStatus === "sent" ? (
              <p className="text-[12px] text-success">
                ✓ Email konfirmasi telah dikirim ulang.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resendStatus === "sending"}
                className="text-[12px] text-fg-muted underline-offset-2 hover:text-accent hover:underline disabled:opacity-60"
              >
                {resendStatus === "sending"
                  ? "Mengirim…"
                  : "Belum menerima email? Klik di sini untuk kirim ulang"}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────
  return (
    <div className="grid min-h-screen place-items-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm rounded-card border border-line bg-card p-8 shadow-card-lg">
        <div className="mb-6 flex flex-col items-center gap-2">
          <Image src="/logo-dark.png" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          <h1 className="text-[20px] font-bold text-fg">Create your account</h1>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading}
          className="flex h-10 w-full items-center justify-center gap-2.5 rounded-btn border border-line bg-card text-[13px] font-semibold text-fg hover:bg-card-hover disabled:opacity-60"
        >
          <GoogleIcon />
          {googleLoading ? "Mengarahkan…" : "Continue with Google"}
        </button>

        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 border-t border-line" />
          <span className="text-[12px] text-fg-muted">or</span>
          <div className="flex-1 border-t border-line" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input id="name" label="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
          <Input id="email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          <Input id="password" type="password" label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} required />
          {error && <p className="text-[12px] text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="flex h-10 w-full items-center justify-center rounded-btn bg-accent text-[13px] font-semibold text-bg hover:bg-accent-hover disabled:opacity-60">
            {loading ? "Membuat akun…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-fg-sub">
          Already have an account?{" "}
          <Link href={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center bg-bg" />}>
      <SignupContent />
    </Suspense>
  );
}
