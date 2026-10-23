import React from "react";
import { createRoot } from "react-dom/client";
import HouseNotes from "../app/HouseNotes";
import { ALL_IDEAS, CATEGORIES } from "../data/ideas";
import "../app/globals.css";

// This entry point mounts the real component with an isolated browser-only
// transport. No request to a notebook API reaches a server. State resets when
// the page reloads; the authenticated app and its routes are unchanged.
const nativeFetch = window.fetch.bind(window);
type DemoIdea = (typeof ALL_IDEAS)[number] & { note: string; sortOrder?: number };
let ideas: DemoIdea[] = ALL_IDEAS.map((idea, sortOrder) => ({ ...idea, note: "", sortOrder }));
let images: Array<{ id: string; filename: string; contentType: string; caption: string; url: string }> = [];
let links: Array<{ id: string; title: string; url: string }> = [];
const categories = new Set<string>(CATEGORIES);
const normalize = (value: string) => value.trim().toLocaleLowerCase().replace(/\s+/g, " ");
const response = (value: unknown, status = 200) => Response.json(value, { status });

window.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith("/api/")) return nativeFetch(input, init);
  const method = init?.method || (input instanceof Request ? input.method : "GET");
  let body: Record<string, unknown> = {};
  if (init?.body && typeof init.body === "string") {
    try { body = JSON.parse(init.body); }
    catch { return response({ error: "Paste a valid JSON idea batch." }, 400); }
  }
  if (url.pathname === "/api/ideas") {
    if (method === "GET") return response({ ideas });
    if (method === "POST") {
      if (typeof body.title !== "string" || !body.title.trim() || !categories.has(String(body.category)))
        return response({ error: "Provide a title and a valid category." }, 400);
      const idea: DemoIdea = {
        id: crypto.randomUUID(), title: body.title.trim().slice(0, 140), detail: String(body.detail || "").slice(0, 600),
        category: body.category as DemoIdea["category"], source: "user", status: "saved",
        interest: ["consider", "love", "research"].includes(String(body.interest)) ? body.interest as DemoIdea["interest"] : "consider", note: "",
      };
      ideas = [...ideas, idea]; return response({ idea }, 201);
    }
  }
  if (url.pathname === "/api/ideas/batch" && method === "POST") {
    const raw = Array.isArray(body) ? body : body.ideas;
    if (!Array.isArray(raw) || !raw.length || raw.length > 250)
      return response({ error: "Provide between 1 and 250 ideas." }, 400);
    const parsed: Array<{ title: string; detail: string; category: DemoIdea["category"] }> = [];
    for (let index = 0; index < raw.length; index++) {
      const item = raw[index];
      if (!item || typeof item.title !== "string" || !item.title.trim()) return response({ error: `Idea ${index + 1} needs a title.` }, 400);
      if (typeof item.detail !== "string" || !item.detail.trim()) return response({ error: `Idea ${index + 1} needs a one-sentence detail.` }, 400);
      if (!categories.has(item.category)) return response({ error: `Idea ${index + 1} uses an unknown category.` }, 400);
      parsed.push({ title: item.title.trim().slice(0, 140), detail: item.detail.trim().slice(0, 600), category: item.category });
    }
    const existing = new Set(ideas.map(idea => normalize(idea.title)));
    const created: DemoIdea[] = [];
    let skipped = 0;
    for (const item of parsed) {
      const key = normalize(item.title);
      if (existing.has(key)) { skipped++; continue; }
      existing.add(key);
      created.push({ ...item, id: crypto.randomUUID(), source: "fresh", status: "candidate", interest: "consider", note: "" });
    }
    ideas = [...ideas, ...created];
    return response({ ideas: created, added: created.length, skipped, batchName: String(body.batchName || "browser-demo") }, 201);
  }
  if (url.pathname.startsWith("/api/ideas/") && method === "PATCH") {
    const id = url.pathname.split("/").pop(); const current = ideas.find(item => item.id === id);
    if (!current) return response({ error: "Idea not found." }, 404);
    const idea: DemoIdea = { ...current };
    if (body.status === "saved" || body.status === "candidate") idea.status = body.status;
    if (["consider", "love", "research"].includes(String(body.interest))) idea.interest = body.interest as DemoIdea["interest"];
    if (typeof body.note === "string") idea.note = body.note.trim().slice(0, 1000);
    ideas = ideas.map(item => item.id === id ? idea : item); return response({ idea });
  }
  if (url.pathname === "/api/images") {
    if (method === "GET") return response({ images });
    if (method === "POST" && init?.body instanceof FormData) {
      const file = init.body.get("image");
      if (!(file instanceof File) || !file.type.startsWith("image/") || file.size > 12 * 1024 * 1024)
        return response({ error: "Choose an image up to 12 MB." }, 400);
      const image = { id: crypto.randomUUID(), filename: file.name, contentType: file.type, caption: String(init.body.get("caption") || ""), url: URL.createObjectURL(file) };
      images = [image, ...images]; return response({ image }, 201);
    }
  }
  if (url.pathname.startsWith("/api/images/") && method === "DELETE") {
    const id = url.pathname.split("/").pop(); const image = images.find(item => item.id === id);
    if (image) URL.revokeObjectURL(image.url);
    images = images.filter(item => item.id !== id); return response({ ok: true });
  }
  if (url.pathname === "/api/links" && method === "GET") return response({ links });
  if (url.pathname.startsWith("/api/links/") && method === "DELETE") {
    links = links.filter(item => item.id !== url.pathname.split("/").pop()); return response({ ok: true });
  }
  return response({ error: "Unavailable in the browser demo." }, 404);
};

createRoot(document.getElementById("root")!).render(<React.StrictMode>
  <div style={{ padding: "10px 24px", background: "#173d32", color: "white", fontFamily: "system-ui", fontSize: 13 }}>
    Public demo · synthetic saved ideas · changes stay in this tab · refresh to reset
  </div>
  <HouseNotes demoMode assetBase={import.meta.env.BASE_URL} />
</React.StrictMode>);
