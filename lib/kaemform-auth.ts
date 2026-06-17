import { createHmac } from "node:crypto";
import type { User } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

export type KaemFormLicenseType = "free" | "trial" | "pro";

export type KaemFormLimits = {
  workspaces: number | null;
  forms: number | null;
  responses_per_month: number | null;
  retention_days: number;
  export_pdf: boolean;
  custom_branding: boolean;
};

export type KaemFormBridgeLicense = {
  type: KaemFormLicenseType;
  expires_at: string | null;
  limits: KaemFormLimits;
  storage_addon: {
    retention_days: number;
    expires_at: string | null;
  };
};

const TOKEN_TTL_SECONDS = 60;
const STORAGE_ADDON_RETENTION_DAYS = 90;

const PLAN_LIMITS: Record<KaemFormLicenseType, KaemFormLimits> = {
  free: {
    workspaces: 1,
    forms: 3,
    responses_per_month: 100,
    retention_days: 7,
    export_pdf: false,
    custom_branding: false,
  },
  trial: {
    workspaces: 3,
    forms: 20,
    responses_per_month: 1000,
    retention_days: 30,
    export_pdf: true,
    custom_branding: true,
  },
  pro: {
    workspaces: null,
    forms: null,
    responses_per_month: null,
    retention_days: 365,
    export_pdf: true,
    custom_branding: true,
  },
};

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signLaunchToken(payload: Record<string, unknown>, secret: string): string {
  const header = base64UrlJson({ alg: "HS256", typ: "JWT" });
  const body = base64UrlJson(payload);
  const signature = createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");

  return `${header}.${body}.${signature}`;
}

export function getKaemFormCallbackUrl(): string {
  const explicit = process.env.KAEMFORM_AUTH_CALLBACK_URL;
  if (explicit) return explicit;

  const baseUrl = process.env.NEXT_PUBLIC_KAEMFORM_URL ?? "https://form.kaemnur.com";
  return `${baseUrl.replace(/\/$/, "")}/auth/callback`;
}

export function getSafeKaemFormRedirectUrl(value: string | null): string {
  const fallback = getKaemFormCallbackUrl();
  if (!value) return fallback;

  try {
    const url = new URL(value);
    const fallbackUrl = new URL(fallback);
    const configuredAppUrl = process.env.NEXT_PUBLIC_KAEMFORM_URL
      ? new URL(process.env.NEXT_PUBLIC_KAEMFORM_URL)
      : null;

    const isLocal =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1";
    const isAllowedHost =
      url.hostname === fallbackUrl.hostname ||
      url.hostname === "form.kaemnur.com" ||
      (configuredAppUrl ? url.hostname === configuredAppUrl.hostname : false);
    const hasAllowedProtocol = url.protocol === "https:" || (isLocal && url.protocol === "http:");

    if (!hasAllowedProtocol) return fallback;
    if (!isLocal && !isAllowedHost) return fallback;
    if (url.pathname !== "/auth/callback") return fallback;

    return url.toString();
  } catch {
    return fallback;
  }
}

function withEffectiveRetention(
  type: KaemFormLicenseType,
  storageRetentionDays: number
): KaemFormLimits {
  const base = PLAN_LIMITS[type];
  return {
    ...base,
    retention_days: Math.max(base.retention_days, storageRetentionDays),
  };
}

export async function getKaemFormBridgeLicense(userId: string): Promise<KaemFormBridgeLicense> {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { slug: { equals: "kaemform", mode: "insensitive" } },
        { slug: { equals: "kaemform-storage", mode: "insensitive" } },
      ],
    },
    select: { id: true, slug: true },
  });

  const kaemformProductId = products.find((p) => p.slug.toLowerCase() === "kaemform")?.id ?? null;
  const storageProductId =
    products.find((p) => p.slug.toLowerCase() === "kaemform-storage")?.id ?? null;

  const [kaemformLicense, storageLicense] = await Promise.all([
    kaemformProductId
      ? prisma.license.findFirst({
          where: { productId: kaemformProductId, userId },
          orderBy: { createdAt: "desc" },
          select: {
            isActivated: true,
            expiresAt: true,
            order: { select: { status: true } },
          },
        })
      : null,
    storageProductId
      ? prisma.license.findFirst({
          where: { productId: storageProductId, userId },
          orderBy: { createdAt: "desc" },
          select: { expiresAt: true },
        })
      : null,
  ]);

  const now = Date.now();
  let type: KaemFormLicenseType = "free";
  let expiresAt: string | null = null;

  if (kaemformLicense) {
    const expiry = kaemformLicense.expiresAt?.getTime() ?? null;
    const active = expiry === null || expiry > now;
    if (active) {
      const paidProOrder = kaemformLicense.order?.status === "SUDAH_DIBAYAR";
      type = paidProOrder || kaemformLicense.isActivated ? "pro" : "trial";
      expiresAt = kaemformLicense.expiresAt?.toISOString() ?? null;
    }
  }

  const storageExpiry = storageLicense?.expiresAt?.getTime() ?? null;
  const storageActive =
    Boolean(storageLicense) && (storageExpiry === null || storageExpiry > now);
  const storageRetentionDays = storageActive ? STORAGE_ADDON_RETENTION_DAYS : 0;

  return {
    type,
    expires_at: expiresAt,
    limits: withEffectiveRetention(type, storageRetentionDays),
    storage_addon: storageActive
      ? {
          retention_days: STORAGE_ADDON_RETENTION_DAYS,
          expires_at: storageLicense?.expiresAt?.toISOString() ?? null,
        }
      : { retention_days: 0, expires_at: null },
  };
}

export async function createKaemFormLaunchToken(user: User) {
  const secret = process.env.LAUNCH_TOKEN_SECRET;
  if (!secret) {
    throw new Error("LAUNCH_TOKEN_SECRET is not configured");
  }
  if (!user.email) {
    throw new Error("Authenticated user has no email");
  }

  const profile = await prisma.userProfile.findUnique({
    where: { id: user.id },
    select: { displayName: true, avatarUrl: true },
  });
  const name =
    user.user_metadata?.full_name ??
    user.user_metadata?.display_name ??
    profile?.displayName ??
    user.email.split("@")[0] ??
    "User";
  const avatarUrl = user.user_metadata?.avatar_url ?? profile?.avatarUrl ?? null;
  const license = await getKaemFormBridgeLicense(user.id);
  const iat = Math.floor(Date.now() / 1000);

  const token = signLaunchToken(
    {
      kaemnur_uid: user.id,
      email: user.email,
      name,
      avatar_url: avatarUrl,
      license,
      iat,
      exp: iat + TOKEN_TTL_SECONDS,
    },
    secret
  );

  return {
    token,
    redirect_url: getKaemFormCallbackUrl(),
    license,
  };
}

export function buildKaemFormTokenRedirect(redirectUrl: string, token: string): URL {
  const url = new URL(redirectUrl);
  url.searchParams.set("token", token);
  return url;
}
