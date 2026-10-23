import { ImageUploadError, storeInspirationImage } from "@/db/inspiration-images";
import { ensureSchema, getD1 } from "@/db/runtime";
import { requireHouseNotesApiAccess } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  await ensureSchema();
  const result = await getD1()
    .prepare(`SELECT id, filename, content_type AS contentType, caption, created_at AS createdAt
      FROM inspiration_images ORDER BY created_at DESC`)
    .all();
  return Response.json({ images: result.results });
}

export async function POST(request: Request) {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  const form = await request.formData();
  const upload = form.get("image");
  const caption = String(form.get("caption") ?? "").trim().slice(0, 240);

  if (!(upload instanceof File)) {
    return Response.json({ error: "Choose an image file." }, { status: 400 });
  }

  try {
    const image = await storeInspirationImage(upload, caption);
    return Response.json({ image }, { status: 201 });
  } catch (error) {
    if (error instanceof ImageUploadError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
