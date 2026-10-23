import { ensureSchema, getD1 } from "@/db/runtime";
import { requireHouseNotesApiAccess } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  await ensureSchema();
  const result = await getD1()
    .prepare(`SELECT id, title, detail, category, source, status, interest, note,
      sort_order AS sortOrder, created_at AS createdAt, updated_at AS updatedAt
      FROM ideas
      ORDER BY CASE status WHEN 'saved' THEN 0 ELSE 1 END, sort_order, created_at`)
    .all();
  return Response.json({ ideas: result.results });
}

export async function POST(request: Request) {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  await ensureSchema();
  const body = (await request.json()) as {
    title?: string;
    detail?: string;
    category?: string;
    interest?: "consider" | "love" | "research";
  };
  const title = body.title?.trim();
  if (!title) return Response.json({ error: "An idea needs a title." }, { status: 400 });

  const id = crypto.randomUUID();
  const category = body.category?.trim() || "Layout & architecture";
  const detail = body.detail?.trim() || "";
  const interest = ["consider", "love", "research"].includes(body.interest ?? "")
    ? body.interest!
    : "consider";
  await getD1()
    .prepare(`INSERT INTO ideas
      (id, title, detail, category, source, status, interest, sort_order)
      VALUES (?, ?, ?, ?, 'custom', 'saved', ?, 10000)`)
    .bind(id, title.slice(0, 140), detail.slice(0, 600), category.slice(0, 80), interest)
    .run();

  const created = await getD1()
    .prepare(`SELECT id, title, detail, category, source, status, interest, note,
      sort_order AS sortOrder, created_at AS createdAt, updated_at AS updatedAt
      FROM ideas WHERE id = ?`)
    .bind(id)
    .first();
  return Response.json({ idea: created }, { status: 201 });
}
