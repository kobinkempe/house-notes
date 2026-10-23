import { ImageUploadError, storeInspirationImage } from "@/db/inspiration-images";
import { extractSharedHttpUrl, storeInspirationLink, titleForSharedLink } from "@/db/inspiration-links";
import { requireHouseNotesApiAccess } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

const MAX_SHARED_IMAGES = 12;

export async function POST(request: Request) {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  const form = await request.formData();
  const uploads = form
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, MAX_SHARED_IMAGES);

  const title = String(form.get("title") ?? "").trim();
  const text = String(form.get("text") ?? "").trim();
  const urlField = String(form.get("url") ?? "").trim();
  const caption = (text || title).slice(0, 240);
  const sharedUrl = extractSharedHttpUrl(urlField, text, title);
  const destination = new URL("/", request.url);
  destination.searchParams.set("view", "images");

  if (!uploads.length) {
    if (sharedUrl) {
      await storeInspirationLink(sharedUrl, titleForSharedLink(sharedUrl, title, text));
      destination.searchParams.set("shared_link", "1");
      return Response.redirect(destination, 303);
    }
    destination.searchParams.set("share_error", "no-content");
    return Response.redirect(destination, 303);
  }

  let saved = 0;
  try {
    for (const upload of uploads) {
      await storeInspirationImage(upload, caption);
      saved += 1;
    }
  } catch (error) {
    if (error instanceof ImageUploadError) {
      destination.searchParams.set("share_error", error.status === 413 ? "too-large" : "invalid-image");
      if (saved) destination.searchParams.set("shared", String(saved));
      return Response.redirect(destination, 303);
    }
    throw error;
  }

  destination.searchParams.set("shared", String(saved));
  return Response.redirect(destination, 303);
}
