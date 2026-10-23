import { ensureSchema, getD1 } from "@/db/runtime";
import { requireHouseNotesApiAccess } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  await ensureSchema();
  const { id } = await context.params;
  const body = (await request.json()) as {
    status?: "saved" | "candidate";
    interest?: "consider" | "love" | "research";
    note?: string;
  };

  const status = body.status === "saved" || body.status === "candidate" ? body.status : null;
  const interest = ["consider", "love", "research"].includes(body.interest ?? "") ? body.interest! : null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : null;

  await getD1()
    .prepare(`UPDATE ideas SET
      status = COALESCE(?, status),
      interest = COALESCE(?, interest),
      note = COALESCE(?, note),
      updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`)
    .bind(status, interest, note, id)
    .run();

  const updated = await getD1()
    .prepare(`SELECT id, title, detail, category, source, status, interest, note,
      sort_order AS sortOrder, created_at AS createdAt, updated_at AS updatedAt
      FROM ideas WHERE id = ?`)
    .bind(id)
    .first();

  if (!updated) return Response.json({ error: "Idea not found." }, { status: 404 });
  return Response.json({ idea: updated });
}
