import { ensureSchema, getD1, getImageBucket } from "@/db/runtime";
import { requireHouseNotesApiAccess } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  await ensureSchema();
  const { id } = await context.params;
  const metadata = await getD1()
    .prepare("SELECT object_key AS objectKey, content_type AS contentType FROM inspiration_images WHERE id = ?")
    .bind(id)
    .first<{ objectKey: string; contentType: string }>();
  if (!metadata) return new Response("Not found", { status: 404 });

  const object = await getImageBucket().get(metadata.objectKey);
  if (!object) return new Response("Not found", { status: 404 });
  return new Response(object.body, {
    headers: {
      "content-type": metadata.contentType,
      "cache-control": "private, max-age=3600",
      etag: object.httpEtag,
    },
  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  await ensureSchema();
  const { id } = await context.params;
  const metadata = await getD1()
    .prepare("SELECT object_key AS objectKey FROM inspiration_images WHERE id = ?")
    .bind(id)
    .first<{ objectKey: string }>();
  if (!metadata) return Response.json({ error: "Image not found." }, { status: 404 });

  await getImageBucket().delete(metadata.objectKey);
  await getD1().prepare("DELETE FROM inspiration_images WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}
