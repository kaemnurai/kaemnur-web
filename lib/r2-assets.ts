import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Cloudflare R2 — public assets bucket (product logos, hero images,
// screenshots). S3-compatible. Separate from the installer/downloads bucket
// in lib/r2.ts. Envs live in .env.local / Vercel (R2_ASSETS_*).
//
// IMPORTANT: env is read INSIDE each function and the S3Client is built
// per-call — never at module level. A deployment missing the R2_ASSETS_*
// vars therefore only errors on an actual upload attempt, never at
// build/import time.

/** True when all R2 assets env vars are present at runtime. */
export function isR2AssetsConfigured(): boolean {
  return Boolean(
    process.env.R2_ASSETS_ACCOUNT_ID &&
      process.env.R2_ASSETS_ACCESS_KEY_ID &&
      process.env.R2_ASSETS_SECRET_ACCESS_KEY &&
      process.env.R2_ASSETS_BUCKET &&
      process.env.R2_ASSETS_PUBLIC_URL
  );
}

/** Upload a buffer to the assets bucket and return its public URL. */
export async function uploadToR2Assets(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const accountId = process.env.R2_ASSETS_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ASSETS_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_ASSETS_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_ASSETS_BUCKET!;
  const publicUrl = process.env.R2_ASSETS_PUBLIC_URL!;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

/** Remove an object from the assets bucket by key. */
export async function deleteFromR2Assets(key: string): Promise<void> {
  const accountId = process.env.R2_ASSETS_ACCOUNT_ID!;
  const accessKeyId = process.env.R2_ASSETS_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.R2_ASSETS_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_ASSETS_BUCKET!;

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Derive the object key from a stored public URL (for deletes). */
export function r2AssetsKeyFromUrl(url: string): string | null {
  const publicBase = process.env.R2_ASSETS_PUBLIC_URL;
  if (!publicBase) return null;
  const base = publicBase.replace(/\/$/, "");
  if (!url.startsWith(base)) return null;
  return url.slice(base.length + 1).split("?")[0];
}
