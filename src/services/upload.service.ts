import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

/** Uploads an image buffer to ImgBB and returns its public URL. The API key never leaves the server. */
export async function uploadToImgbb(buffer: Buffer): Promise<string> {
  const body = new URLSearchParams();
  body.append("image", buffer.toString("base64"));

  type ImgbbResponse = { success?: boolean; data?: { display_url?: string; url?: string } };
  let json = null as ImgbbResponse | null;
  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(env.IMGBB_API_KEY)}`, {
      method: "POST",
      body,
    });
    json = (await res.json()) as ImgbbResponse;
    if (!res.ok) json = null;
  } catch {
    json = null;
  }
  const url = json?.success ? (json.data?.display_url ?? json.data?.url) : undefined;
  if (!url) throw new ApiError(502, "Image upload failed. Please try again.", "UPLOAD_FAILED");
  return url;
}
