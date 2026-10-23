import { ensureSchema, getD1, getImageBucket } from "@/db/runtime";

export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

export type StoredInspirationImage = {
  id: string;
  filename: string;
  contentType: string;
  caption: string;
  url: string;
};

export class ImageUploadError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "ImageUploadError";
  }
}

export async function storeInspirationImage(
  upload: File,
  captionInput = "",
): Promise<StoredInspirationImage> {
  if (!upload.type.startsWith("image/")) {
    throw new ImageUploadError("Choose an image file.", 400);
  }
  if (upload.size > MAX_IMAGE_BYTES) {
    throw new ImageUploadError("Images must be 12 MB or smaller.", 413);
  }

  await ensureSchema();
  const id = crypto.randomUUID();
  const filename = upload.name || "shared-image";
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || "inspiration-image";
  const objectKey = `inspiration/${id}/${safeName}`;
  const caption = captionInput.trim().slice(0, 240);
  const bucket = getImageBucket();

  await bucket.put(objectKey, await upload.arrayBuffer(), {
    httpMetadata: { contentType: upload.type },
    customMetadata: { originalName: filename },
  });

  try {
    await getD1()
      .prepare(`INSERT INTO inspiration_images
        (id, object_key, filename, content_type, caption) VALUES (?, ?, ?, ?, ?)`)
      .bind(id, objectKey, filename.slice(0, 160), upload.type, caption)
      .run();
  } catch (error) {
    await bucket.delete(objectKey);
    throw error;
  }

  return { id, filename, contentType: upload.type, caption, url: `/api/images/${id}` };
}
