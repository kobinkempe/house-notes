import { env } from "cloudflare:workers";
import { ALL_IDEAS, BRAINSTORM_IDEAS } from "@/data/ideas";

type HouseNotesBindings = {
  DB?: D1Database;
  IDEA_IMAGES?: R2Bucket;
};

export function getBindings(): HouseNotesBindings {
  return env as unknown as HouseNotesBindings;
}

export function getD1(): D1Database {
  const db = getBindings().DB;
  if (!db) throw new Error("House Notes database is unavailable.");
  return db;
}

export function getImageBucket(): R2Bucket {
  const bucket = getBindings().IDEA_IMAGES;
  if (!bucket) throw new Error("House Notes image storage is unavailable.");
  return bucket;
}

let schemaPromise: Promise<void> | undefined;

export async function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = initializeSchema().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
}

async function initializeSchema() {
  const db = getD1();
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS ideas (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      detail TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'brainstorm',
      status TEXT NOT NULL DEFAULT 'candidate',
      interest TEXT NOT NULL DEFAULT 'consider',
      note TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_ideas_status_category_sort ON ideas (status, category, sort_order)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS inspiration_images (
      id TEXT PRIMARY KEY,
      object_key TEXT NOT NULL UNIQUE,
      filename TEXT NOT NULL,
      content_type TEXT NOT NULL,
      caption TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_inspiration_images_created ON inspiration_images (created_at DESC)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS inspiration_links (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS idx_inspiration_links_created ON inspiration_links (created_at DESC)"),
    db.prepare("PRAGMA optimize"),
  ]);

  const inserts = ALL_IDEAS.map((seed, index) =>
    db
      .prepare(`INSERT OR IGNORE INTO ideas
        (id, title, detail, category, source, status, interest, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(seed.id, seed.title, seed.detail, seed.category, seed.source, seed.status, seed.interest, index),
  );

  for (let index = 0; index < inserts.length; index += 40) {
    await db.batch(inserts.slice(index, index + 40));
  }

  // The original browse library has already been reviewed. Keep those records
  // for history, but remove any still-candidate entries from the active batches.
  const reviewedPlaceholders = BRAINSTORM_IDEAS.map(() => "?").join(", ");
  await db
    .prepare(`UPDATE ideas
      SET status = 'reviewed', updated_at = CURRENT_TIMESTAMP
      WHERE status = 'candidate' AND id IN (${reviewedPlaceholders})`)
    .bind(...BRAINSTORM_IDEAS.map((idea) => idea.id))
    .run();
}
