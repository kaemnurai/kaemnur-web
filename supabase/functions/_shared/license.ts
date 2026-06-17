import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type LicenseType = "free" | "trial" | "pro";

export interface LicenseLimits {
  workspaces: number | null;
  forms: number | null;
  responses_per_month: number | null;
  retention_days: number;
  export_pdf: boolean;
  custom_branding: boolean;
}

export interface LicenseInfo {
  type: LicenseType;
  expires_at: string | null;
  limits: LicenseLimits;
  storage_addon: {
    retention_days: number;
    expires_at: string | null;
  };
}

export interface ProductIds {
  kaemformId: string | null;
  storageId: string | null;
}

const STORAGE_ADDON_RETENTION_DAYS = 90;

const PLAN_LIMITS: Record<LicenseType, LicenseLimits> = {
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

function limitsFor(type: LicenseType, storageRetentionDays: number): LicenseLimits {
  const base = PLAN_LIMITS[type];
  return {
    ...base,
    retention_days: Math.max(base.retention_days, storageRetentionDays),
  };
}

export async function getProductIds(supabase: SupabaseClient): Promise<ProductIds> {
  const { data, error } = await supabase
    .from("Product")
    .select("id, slug")
    .in("slug", ["kaemform", "kaemform-storage"]);

  if (error) throw error;

  return {
    kaemformId: data?.find((p) => p.slug === "kaemform")?.id ?? null,
    storageId: data?.find((p) => p.slug === "kaemform-storage")?.id ?? null,
  };
}

interface LicenseRow {
  id: string;
  expiresAt: string | null;
  isActivated: boolean;
}

async function latestLicense(
  supabase: SupabaseClient,
  productId: string,
  userId: string
): Promise<LicenseRow | null> {
  const { data, error } = await supabase
    .from("License")
    .select("id, expiresAt, isActivated")
    .eq("productId", productId)
    .eq("userId", userId)
    .order("createdAt", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

async function hasPaidOrder(supabase: SupabaseClient, licenseId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("Order")
    .select("status")
    .eq("licenseId", licenseId)
    .eq("status", "SUDAH_DIBAYAR")
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.status === "SUDAH_DIBAYAR";
}

export async function getLicenseInfo(
  supabase: SupabaseClient,
  userId: string,
  productIds: ProductIds
): Promise<LicenseInfo> {
  const now = Date.now();

  let type: LicenseType = "free";
  let expires_at: string | null = null;

  if (productIds.kaemformId) {
    const row = await latestLicense(supabase, productIds.kaemformId, userId);
    if (row) {
      const expiry = row.expiresAt ? new Date(row.expiresAt).getTime() : null;
      const active = expiry === null || expiry > now;
      if (active) {
        const paidProOrder = await hasPaidOrder(supabase, row.id);
        type = paidProOrder || row.isActivated ? "pro" : "trial";
        expires_at = row.expiresAt;
      }
    }
  }

  let storage_addon = { retention_days: 0, expires_at: null as string | null };
  if (productIds.storageId) {
    const row = await latestLicense(supabase, productIds.storageId, userId);
    if (row) {
      const expiry = row.expiresAt ? new Date(row.expiresAt).getTime() : null;
      if (expiry === null || expiry > now) {
        storage_addon = {
          retention_days: STORAGE_ADDON_RETENTION_DAYS,
          expires_at: row.expiresAt,
        };
      }
    }
  }

  return {
    type,
    expires_at,
    limits: limitsFor(type, storage_addon.retention_days),
    storage_addon,
  };
}
