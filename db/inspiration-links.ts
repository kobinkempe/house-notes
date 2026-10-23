import { ensureSchema, getD1 } from "@/db/runtime";

export type StoredInspirationLink = {
  id: string;
  url: string;
  title: string;
};

export function extractSharedHttpUrl(...values: string[]): string | null {
  for (const value of values) {
    const matches = value.match(/https?:\/\/[^\s<>"']+/gi) ?? [];
    for (const match of matches) {
      const candidate = match.replace(/[),.;!?]+$/, "");
      try {
        const parsed = new URL(candidate);
        if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.toString();
      } catch {
        // Keep looking for a valid web address in the remaining shared fields.
      }
    }
  }
  return null;
}

export function titleForSharedLink(url: string, ...values: string[]): string {
  for (const value of values) {
    const title = value.replace(url, "").replace(/https?:\/\/[^\s<>"']+/gi, "").replace(/\s+/g, " ").trim();
    if (title) return title.slice(0, 160);
  }
  return new URL(url).hostname.replace(/^www\./, "").slice(0, 160);
}

export async function storeInspirationLink(urlInput: string, titleInput = ""): Promise<StoredInspirationLink> {
  const url = extractSharedHttpUrl(urlInput);
  if (!url) throw new Error("A valid web link is required.");

  await ensureSchema();
  const id = crypto.randomUUID();
  const title = titleInput.trim().slice(0, 160) || new URL(url).hostname.replace(/^www\./, "");
  await getD1()
    .prepare("INSERT INTO inspiration_links (id, url, title) VALUES (?, ?, ?)")
    .bind(id, url, title)
    .run();

  return { id, url, title };
}
