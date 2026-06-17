"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/Toast";
import { Icon } from "@/components/ui/Icon";

export type KaemFormLicenseType = "free" | "trial" | "pro";

const KAEMFORM_PRIMARY_WORKSPACE_URL = "https://form.kaemnur.com/";
const KAEMFORM_FALLBACK_WORKSPACE_URL = "https://kaemform-web.vercel.app/";

async function canReachWorkspace(url: string): Promise<boolean> {
  if (typeof window === "undefined") return true;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 2500);

  try {
    await fetch(url, {
      method: "HEAD",
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function resolveWorkspaceUrl(targetUrl: URL): Promise<URL> {
  if (targetUrl.hostname !== "form.kaemnur.com") return targetUrl;

  const fallbackUrl = new URL(targetUrl.toString());
  fallbackUrl.protocol = "https:";
  fallbackUrl.host = new URL(KAEMFORM_FALLBACK_WORKSPACE_URL).host;

  const primaryReady = await canReachWorkspace(KAEMFORM_PRIMARY_WORKSPACE_URL);
  return primaryReady ? targetUrl : fallbackUrl;
}

export function KaemFormLaunchCard({
  productId,
  productSlug,
  loggedIn,
  licenseType,
  expiresAt,
  trialClaimed,
  launchMode = null,
}: {
  productId: string;
  productSlug: string;
  loggedIn: boolean;
  licenseType: KaemFormLicenseType;
  expiresAt: string | null;
  trialClaimed: boolean;
  launchMode?: "desktop" | "web" | null;
}) {
  const router = useRouter();
  const desktopLaunch = launchMode === "desktop";
  const webLaunch = launchMode === "web";
  const autoLaunch = desktopLaunch || webLaunch;
  const autoLaunchRef = useRef(false);
  const [loading, setLoading] = useState<"launch" | "trial" | "buy" | null>(null);
  const productPath = `/products/${encodeURIComponent(productSlug)}${
    desktopLaunch ? "?desktop=1" : webLaunch ? "?launch=1" : ""
  }`;
  const loginPath = `/login?redirect=${encodeURIComponent(productPath)}`;

  const expiryLabel = expiresAt
    ? new Date(expiresAt).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const launch = useCallback(async () => {
    setLoading("launch");
    try {
      const res = await fetch("/api/products/kaemform/launch", { method: "POST" });
      if (res.status === 401) {
        router.push(loginPath);
        return;
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token || !data?.redirect_url) {
        toast(data.error || "Gagal membuka KaemForm. Coba lagi.", "error");
        return;
      }

      const callbackUrl = new URL(data.redirect_url);
      callbackUrl.searchParams.set("token", data.token);
      if (desktopLaunch) {
        callbackUrl.searchParams.set("redirect_to", "kaemform://auth/callback");
      }

      const workspaceUrl = await resolveWorkspaceUrl(callbackUrl);
      window.location.href = workspaceUrl.toString();
    } catch {
      toast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setLoading(null);
    }
  }, [desktopLaunch, loginPath, router]);

  useEffect(() => {
    if (!autoLaunch || !loggedIn || autoLaunchRef.current) return;
    autoLaunchRef.current = true;
    void launch();
  }, [autoLaunch, launch, loggedIn]);

  async function handleLaunch() {
    await launch();
  }

  function handleLogin() {
    router.push(loginPath);
  }

  async function handleTrial() {
    if (!loggedIn) {
      router.push(loginPath);
      return;
    }
    setLoading("trial");
    try {
      const res = await fetch("/api/products/kaemform/trial", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Gagal mengaktifkan trial.", "error");
        return;
      }
      toast("Trial 14 hari diaktifkan!", "success");
      router.refresh();
    } catch {
      toast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setLoading(null);
    }
  }

  async function handleBuy() {
    if (!loggedIn) {
      router.push(loginPath);
      return;
    }
    setLoading("buy");
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || "Gagal membuat pesanan.", "error");
        return;
      }
      router.push(`/transaksi/${data.orderId}`);
    } catch {
      toast("Terjadi kesalahan jaringan.", "error");
    } finally {
      setLoading(null);
    }
  }

  const canLaunch = loggedIn;

  return (
    <div className="rounded-card border border-line bg-card p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-btn bg-accent/10 text-accent">
          <Icon name="grid" size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-fg">Workspace KaemForm</p>
          <p className="text-[12px] text-fg-sub">
            {desktopLaunch
              ? "Hubungkan KaemForm Desktop dengan akun Kaemnur."
              : "Buka dashboard formulir, respons, dan pengaturan dari web app KaemForm."}
          </p>
        </div>
      </div>

      <div className="my-4 border-t border-line" />

      {canLaunch ? (
        <>
          <p className="mb-3 text-[13px] text-fg">
            <span className="font-semibold text-accent">
              {licenseType === "pro" ? "Pro" : licenseType === "trial" ? "Trial" : "Free"}
            </span>
            {" - "}
            {expiryLabel ? `berlaku hingga ${expiryLabel}` : "berlaku seumur hidup"}
          </p>
          <button
            type="button"
            onClick={handleLaunch}
            disabled={loading !== null}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            <Icon name="external-link" size={14} />
            {loading === "launch" ? "Membuka..." : "Buka Workspace"}
          </button>
          {licenseType === "free" && (
            <div className="mt-2 flex flex-col gap-2">
              {!trialClaimed && (
                <button
                  type="button"
                  onClick={handleTrial}
                  disabled={loading !== null}
                  className="flex h-10 w-full items-center justify-center rounded-btn border border-accent/40 bg-accent/5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
                >
                  {loading === "trial" ? "Memproses..." : "Coba Pro Gratis 14 Hari"}
                </button>
              )}
              <button
                type="button"
                onClick={handleBuy}
                disabled={loading !== null}
                className="flex h-10 w-full items-center justify-center rounded-btn border border-line bg-transparent text-[13px] font-medium text-fg-sub transition-colors hover:border-fg-sub hover:text-fg disabled:opacity-60"
              >
                {loading === "buy" ? "Memproses..." : "Beli Lisensi Pro"}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleLogin}
            disabled={loading !== null}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-btn bg-accent text-[13px] font-semibold text-bg transition-colors hover:bg-accent-hover disabled:opacity-60"
          >
            <Icon name="external-link" size={14} />
            Masuk untuk Buka Workspace
          </button>
          {!trialClaimed && (
            <button
              type="button"
              onClick={handleTrial}
              disabled={loading !== null}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-btn border border-accent/40 bg-accent/5 text-[13px] font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-60"
            >
              {loading === "trial" ? "Memproses..." : "Coba Gratis 14 Hari"}
            </button>
          )}
          <button
            type="button"
            onClick={handleBuy}
            disabled={loading !== null}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-btn border border-line bg-transparent text-[13px] font-medium text-fg-sub transition-colors hover:border-fg-sub hover:text-fg disabled:opacity-60"
          >
            {loading === "buy" ? "Memproses..." : "Beli Lisensi"}
          </button>
        </div>
      )}
    </div>
  );
}
