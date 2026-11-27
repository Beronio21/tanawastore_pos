import { NextResponse } from "next/server";
import {
  ALLOWED_UPLOAD_TYPES,
  MAX_UPLOAD_BYTES,
  UPLOAD_FOLDERS,
  r2Configured,
  uploadToR2,
  type UploadFolder,
} from "@/lib/r2";
import { REGISTER_COOKIE, cookieFromRequest, getRequestTenantContext } from "@/lib/tenant";

/** POST /api/v1/uploads — multipart `file` + `folder`. */
export async function POST(request: Request) {
  const tenant = await getRequestTenantContext(cookieFromRequest(request, REGISTER_COOKIE));
  if (!tenant) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  const folder = String(form.get("folder") ?? "products") as UploadFolder;
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A file field is required" }, { status: 400 });
  }
  if (!UPLOAD_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: "folder must be products, logos or attachments" }, { status: 400 });
  }
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Only JPEG, PNG and WebP images are allowed" }, { status: 415 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "Images must be 5 MB or smaller" }, { status: 413 });
  }

  const body = await file.arrayBuffer();

  // Offline/CI fallback: return a resized-by-browser data URL so uploads need
  // no CORS, network or credentials.
  if (!r2Configured()) {
    const dataUrl = `data:${file.type};base64,${Buffer.from(body).toString("base64")}`;
    return NextResponse.json({ url: dataUrl, key: "local", mode: "local" });
  }

  try {
    const uploaded = await uploadToR2({
      tenantId: tenant.tenantId,
      folder,
      filename: file.name || "image",
      contentType: file.type,
      body,
    });
    return NextResponse.json({ ...uploaded, mode: "r2" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 502 },
    );
  }
}
