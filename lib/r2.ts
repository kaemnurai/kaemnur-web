import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { sanitizeSegment } from "@/lib/upload-helpers";

// Cloudflare R2 is S3-compatible. These envs are optional in dev — when they
// are not set, isR2Configured() returns false and installer upload is disabled.

const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT;
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY;
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_KEY;
const bucket = process.env.CLOUDFLARE_R2_BUCKET;
const publicBase = process.env.CLOUDFLARE_R2_PUBLIC_URL;

export function isR2Configured(): boolean {
  return Boolean(endpoint && accessKeyId && secretAccessKey && bucket);
}

let client: S3Client | null = null;
function getClient(): S3Client {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 is not configured");
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });
  }
  return client;
}

/** Public URL for a stored object key. */
export function publicUrl(key: string): string {
  if (publicBase) return `${publicBase.replace(/\/$/, "")}/${key}`;
  return `${endpoint?.replace(/\/$/, "")}/${bucket}/${key}`;
}

export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  return publicUrl(key);
}

export async function deleteObject(key: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket, Key: key })
  );
}

/**
 * Presigned PUT URL so the browser can upload large installer files
 * directly to R2 — the file never passes through a Vercel function body,
 * which is capped far below typical installer sizes.
 */
export async function createPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 600
): Promise<string> {
  return getSignedUrl(
    getClient(),
    new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType }),
    { expiresIn: expiresInSeconds }
  );
}

/** Object key for an installer release: "{productSlug}/{sanitizedFilename}". */
export function buildInstallerKey(productSlug: string, filename: string): string {
  return `${sanitizeSegment(productSlug)}/${sanitizeSegment(filename)}`;
}
