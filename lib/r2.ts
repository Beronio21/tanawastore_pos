/**
 * Cloudflare R2 media storage.
 *
 * Objects are always tenant-isolated under `pos/${tenantId}/${folder}/...`.
 * When the R2 env vars are absent the caller falls back to a local data URL.
 */
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

export type UploadFolder = "products" | "logos" | "attachments";

export const UPLOAD_FOLDERS: UploadFolder[] = ["products", "logos", "attachments"];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function r2Configured(): boolean {
  return Boolean(
    process.env.CLOUDFLARE_R2_ACCOUNT_ID &&
      process.env.CLOUDFLARE_R2_BUCKET_NAME &&
      process.env.CLOUDFLARE_R2_ACCESS_KEY_ID &&
      process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  );
}

let cached: S3Client | null = null;

export function getR2Client(): S3Client | null {
  if (!r2Configured()) return null;
  if (!cached) {
    cached = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID as string,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY as string,
      },
    });
  }
  return cached;
}

/** Strip path traversal and exotic characters from the uploaded filename. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  return base
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[.-]+/, "")
    .slice(-80) || "file";
}

/** `pos/<tenantId>/<folder>/<uuid>-<filename>` */
export function buildR2Key(
  tenantId: string,
  folder: UploadFolder,
  filename: string,
  id: string = randomUUID(),
): string {
  return `pos/${tenantId}/${folder}/${id}-${sanitizeFilename(filename)}`;
}

export function r2PublicUrl(key: string): string {
  const base = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
  return base ? `${base}/${key}` : `/${key}`;
}

/** Upload one validated image, returning its public URL and object key. */
export async function uploadToR2(input: {
  tenantId: string;
  folder: UploadFolder;
  filename: string;
  contentType: string;
  body: ArrayBuffer;
}): Promise<{ url: string; key: string }> {
  const client = getR2Client();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  if (!client || !bucket) throw new Error("R2 is not configured");

  const key = buildR2Key(input.tenantId, input.folder, input.filename);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: new Uint8Array(input.body),
      ContentType: input.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  return { url: r2PublicUrl(key), key };
}
