import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

// Cloudflare R2 — public assets bucket (product logos, hero images,
// screenshots). S3-compatible. Separate from the installer/downloads bucket
// in lib/r2.ts. Envs live in .env.local (R2_ASSETS_*).

const accountId = process.env.R2_ASSETS_ACCOUNT_ID;
const accessKeyId = process.env.R2_ASSETS_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_ASSETS_SECRET_ACCESS_KEY;
const bucket = process.env.R2_ASSETS_BUCKET;
const publicBase = process.env.R2_ASSETS_PUBLIC_URL;

export function isR2AssetsConfigured(): boolean {
  return Boolean(accountId && accessKeyId && secretAccessKey && bucket && publicBase);
}

let client: S3Client | null = null;

/** Lazily build the S3 client for the Cloudflare R2 assets bucket. */
export function getR2AssetsClient(): S3Client {
  if (!isR2AssetsConfigured()) {
    throw new Error("Cloudflare R2 assets bucket is not configured (R2_ASSETS_* env).");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }
  return client;
}

/** Upload a buffer to the assets bucket and return its public URL. */
export async function uploadToR2Assets(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  await getR2AssetsClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return `${publicBase!.replace(/\/$/, "")}/${key}`;
}

/** Remove an object from the assets bucket by key. */
export async function deleteFromR2Assets(key: string): Promise<void> {
  await getR2AssetsClient().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  );
}

/** Derive the object key from a stored public URL (for deletes). */
export function r2AssetsKeyFromUrl(url: string): string | null {
  if (!publicBase) return null;
  const base = publicBase.replace(/\/$/, "");
  if (!url.startsWith(base)) return null;
  return url.slice(base.length + 1).split("?")[0];
}
