import { ensureSchema, getD1 } from "@/db/runtime";
import { requireHouseNotesApiAccess } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  await ensureSchema();
  const { id } = await context.params;
  const existing = await getD1()
    .prepare("SELECT id FROM inspiration_links WHERE id = ?")
    .bind(id)
    .first();
  if (!existing) return Response.json({ error: "Link not found." }, { status: 404 });

  await getD1().prepare("DELETE FROM inspiration_links WHERE id = ?").bind(id).run();
  return Response.json({ ok: true });
}
