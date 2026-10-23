import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ideas = sqliteTable(
  "ideas",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    detail: text("detail").notNull().default(""),
    category: text("category").notNull(),
    source: text("source").notNull().default("brainstorm"),
    status: text("status").notNull().default("candidate"),
    interest: text("interest").notNull().default("consider"),
    note: text("note").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_ideas_status_category_sort").on(table.status, table.category, table.sortOrder)],
);

export const inspirationImages = sqliteTable(
  "inspiration_images",
  {
    id: text("id").primaryKey(),
    objectKey: text("object_key").notNull().unique(),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    caption: text("caption").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_inspiration_images_created").on(table.createdAt)],
);

export const inspirationLinks = sqliteTable(
  "inspiration_links",
  {
    id: text("id").primaryKey(),
    url: text("url").notNull(),
    title: text("title").notNull().default(""),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("idx_inspiration_links_created").on(table.createdAt)],
);
