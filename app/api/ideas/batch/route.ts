import { requireHouseNotesApiAccess } from "@/app/chatgpt-auth";
import { CATEGORIES, type IdeaCategory } from "@/data/ideas";
import { ensureSchema, getD1 } from "@/db/runtime";

export const dynamic = "force-dynamic";

type BatchIdeaInput = {
  title?: unknown;
  category?: unknown;
  detail?: unknown;
};

type BatchRequest = {
  batchName?: unknown;
  ideas?: unknown;
};

const MAX_BATCH_SIZE = 250;
const allowedCategories = new Set<string>(CATEGORIES);

export async function POST(request: Request) {
  const accessError = await requireHouseNotesApiAccess();
  if (accessError) return accessError;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return Response.json({ error: "Paste a valid JSON idea batch." }, { status: 400 });
  }

  const body: BatchRequest = Array.isArray(raw) ? { ideas: raw } : (raw ?? {}) as BatchRequest;
  if (!Array.isArray(body.ideas) || body.ideas.length === 0) {
    return Response.json({ error: "The batch needs a non-empty ideas array." }, { status: 400 });
  }
  if (body.ideas.length > MAX_BATCH_SIZE) {
    return Response.json({ error: `A batch can contain at most ${MAX_BATCH_SIZE} ideas.` }, { status: 400 });
  }

  const parsedIdeas: Array<{ title: string; category: IdeaCategory; detail: string }> = [];
  const payloadTitles = new Set<string>();
  let skippedDuplicates = 0;

  for (let index = 0; index < body.ideas.length; index += 1) {
    const item = body.ideas[index] as BatchIdeaInput | null;
    const title = typeof item?.title === "string" ? item.title.trim().slice(0, 140) : "";
    const detail = typeof item?.detail === "string" ? item.detail.trim().slice(0, 600) : "";
    const category = typeof item?.category === "string" ? item.category.trim() : "";

    if (!title) {
      return Response.json({ error: `Idea ${index + 1} needs a title.` }, { status: 400 });
    }
    if (!detail) {
      return Response.json({ error: `Idea ${index + 1} needs a one-sentence detail.` }, { status: 400 });
    }
    if (!allowedCategories.has(category)) {
      return Response.json({
        error: `Idea ${index + 1} uses an unknown category. Use one of: ${CATEGORIES.join(", ")}.`,
      }, { status: 400 });
    }

    const normalizedTitle = normalizeTitle(title);
    if (payloadTitles.has(normalizedTitle)) {
      skippedDuplicates += 1;
      continue;
    }
    payloadTitles.add(normalizedTitle);
    parsedIdeas.push({ title, category: category as IdeaCategory, detail });
  }

  await ensureSchema();
  const db = getD1();
  const existingRows = await db.prepare("SELECT title FROM ideas").all<{ title: string }>();
  const existingTitles = new Set(
    existingRows.results.map((row) => normalizeTitle(row.title)),
  );
  const newIdeas = parsedIdeas.filter((idea) => {
    if (existingTitles.has(normalizeTitle(idea.title))) {
      skippedDuplicates += 1;
      return false;
    }
    return true;
  });

  const batchName = cleanBatchName(body.batchName);
  const source = `batch:${batchName}`;
  const maxSortRow = await db
    .prepare("SELECT COALESCE(MAX(sort_order), 0) AS maxSortOrder FROM ideas")
    .first<{ maxSortOrder: number }>();
  const firstSortOrder = Number(maxSortRow?.maxSortOrder ?? 0) + 1;
  const created = newIdeas.map((idea, index) => ({
    id: crypto.randomUUID(),
    ...idea,
    source,
    status: "candidate" as const,
    interest: "consider" as const,
    note: "",
    sortOrder: firstSortOrder + index,
  }));

  const inserts = created.map((idea) => db
    .prepare(`INSERT INTO ideas
      (id, title, detail, category, source, status, interest, note, sort_order)
      VALUES (?, ?, ?, ?, ?, 'candidate', 'consider', '', ?)`)
    .bind(idea.id, idea.title, idea.detail, idea.category, idea.source, idea.sortOrder));

  for (let index = 0; index < inserts.length; index += 50) {
    await db.batch(inserts.slice(index, index + 50));
  }

  return Response.json({
    ideas: created,
    added: created.length,
    skipped: skippedDuplicates,
    batchName,
  }, { status: 201 });
}

function normalizeTitle(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

function cleanBatchName(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return `ai-${new Date().toISOString().slice(0, 10)}`;
  const cleaned = value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return cleaned || `ai-${new Date().toISOString().slice(0, 10)}`;
}
