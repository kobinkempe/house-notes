import { ensureSchema, getD1 } from "@/db/runtime";
import { requireHouseNotesApiAccess } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  await ensureSchema();
  const result = await getD1()
    .prepare(`SELECT id, url, title, created_at AS createdAt
      FROM inspiration_links ORDER BY created_at DESC`)
    .all();
  return Response.json({ links: result.results });
}
