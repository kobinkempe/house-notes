import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render(headers = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html", ...headers } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the House Notes idea book", async () => {
  const response = await render({
    "oai-authenticated-user-id": "owner-test",
    "oai-authenticated-user-email": "demo-owner@example.invalid",
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>House Notes — a private home idea book<\/title>/i);
  assert.match(html, /Add something new/);
  assert.match(html, /My ideas/);
  assert.match(html, /Browse ideas/);
  assert.match(html, /Images/);
  assert.match(html, /Heated floors/);
  assert.match(html, /Filter My ideas by interest/);
  assert.match(html, /Researching/);
  assert.match(html, /Design &amp; layout/);
  assert.match(html, /Comfort &amp; convenience/);
  assert.match(html, /Landscaping &amp; outdoors/);
  assert.match(html, /Browse ideas <span>150<\/span>/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Your site is taking shape/i);
  const manifestLinkIndex = html.indexOf('<link rel="manifest"');
  const headEndIndex = html.indexOf("</head>");
  assert.ok(manifestLinkIndex >= 0, "renders the web app manifest link");
  assert.ok(manifestLinkIndex < headEndIndex, "renders install metadata inside the document head");
});

test("requires the owning ChatGPT account for the notebook page", async () => {
  const anonymous = await render();
  assert.equal(anonymous.status, 307);
  assert.equal(
    anonymous.headers.get("location"),
    "/signin-with-chatgpt?return_to=%2F",
  );

  const wrongAccount = await render({
    "oai-authenticated-user-id": "other-test",
    "oai-authenticated-user-email": "someone@example.com",
  });
  assert.equal(wrongAccount.status, 307);
  assert.equal(wrongAccount.headers.get("location"), "/not-authorized");
});

test("removed the starter preview and kept product assets", async () => {
  const [page, layout, component, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/HouseNotes.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<HouseNotes \/>/);
  assert.match(layout, /openGraph/);
  assert.match(layout, /manifest\.webmanifest/);
  assert.match(layout, /export const metadata/);
  assert.doesNotMatch(layout, /generateMetadata|headers\(\)/);
  assert.match(component, /house-notes-inspiration\.png/);
  assert.match(component, /\/api\/ideas/);
  assert.match(component, /\/api\/links/);
  assert.match(component, /serviceWorker\.register\("\/sw\.js"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await access(new URL("../public/house-notes-inspiration.png", import.meta.url));
  await access(new URL("../public/og.png", import.meta.url));
  await access(new URL("../app/manifest.webmanifest/route.ts", import.meta.url));
  await access(new URL("../public/sw.js", import.meta.url));
  await access(new URL("../public/house-notes-icon-192.png", import.meta.url));
  await access(new URL("../public/house-notes-icon-512.png", import.meta.url));
  await assert.rejects(access(new URL("../app/_sites-preview", import.meta.url)));
  await access(new URL("../drizzle/0000_nifty_wrecker.sql", import.meta.url));
  await access(new URL("../drizzle/0001_heavy_bill_hollister.sql", import.meta.url));
  await access(new URL("../app/api/links/route.ts", import.meta.url));
  await access(new URL("../app/api/links/[id]/route.ts", import.meta.url));
  await access(new URL("../app/api/ideas/batch/route.ts", import.meta.url));
  await access(new URL("../HANDOFF.md", import.meta.url));
  await access(new URL("../AGENTS.md", import.meta.url));
  await access(new URL("../docs/idea-batch.example.json", import.meta.url));
  await access(templateRoot);
});

test("registers House Notes as an Android image share target", async () => {
  const manifestRoute = await readFile(new URL("../app/manifest.webmanifest/route.ts", import.meta.url), "utf8");

  assert.match(manifestRoute, /name: "House Notes"/);
  assert.match(manifestRoute, /display: "standalone"/);
  assert.match(manifestRoute, /prefer_related_applications: false/);
  assert.match(manifestRoute, /purpose: "maskable"/);
  assert.match(manifestRoute, /action: "\/share-target"/);
  assert.match(manifestRoute, /method: "POST"/);
  assert.match(manifestRoute, /enctype: "multipart\/form-data"/);
  assert.match(manifestRoute, /name: "images"/);
  assert.match(manifestRoute, /"image\/\*"/);
  assert.match(manifestRoute, /application\/manifest\+json/);
});

test("handles image and link Android shares", async () => {
  const route = await readFile(new URL("../app/share-target/route.ts", import.meta.url), "utf8");

  assert.match(route, /getAll\("images"\)/);
  assert.match(route, /storeInspirationImage\(upload, caption\)/);
  assert.match(route, /extractSharedHttpUrl\(urlField, text, title\)/);
  assert.match(route, /storeInspirationLink\(sharedUrl/);
  assert.match(route, /shared_link", "1"/);
  assert.match(route, /Response\.redirect\(destination, 303\)/);
  assert.match(route, /requireHouseNotesApiAccess\(\)/);
});

test("protects every notes and image API route", async () => {
  const routePaths = [
    "../app/api/ideas/route.ts",
    "../app/api/ideas/[id]/route.ts",
    "../app/api/ideas/batch/route.ts",
    "../app/api/images/route.ts",
    "../app/api/images/[id]/route.ts",
    "../app/api/links/route.ts",
    "../app/api/links/[id]/route.ts",
  ];
  const routes = await Promise.all(
    routePaths.map((path) => readFile(new URL(path, import.meta.url), "utf8")),
  );

  for (const route of routes) {
    assert.match(route, /requireHouseNotesApiAccess\(\)/);
  }
});

test("uses compact two-line idea rows, full expanded cards, and read-only saved notes", async () => {
  const [component, styles] = await Promise.all([
    readFile(new URL("../app/HouseNotes.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /className="compact-idea-list"/);
  assert.match(component, /className="idea-row-toggle"/);
  assert.match(component, /aria-expanded=\{expanded\}/);
  assert.match(component, /className="expanded-idea-card"/);
  assert.match(component, /className="idea-note-text expanded-note-text"/);
  assert.match(component, />Edit note<\/button>/);
  assert.match(component, /setEditingNote\(false\)/);
  assert.match(component, /function InterestIcon/);
  assert.match(styles, /-webkit-line-clamp: 2/);
  assert.match(styles, /\.expanded-idea-card/);
});

test("shows the full browse library, gallery zoom, and explicit ChatGPT handoffs", async () => {
  const [component, styles] = await Promise.all([
    readFile(new URL("../app/HouseNotes.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(component, /All \{candidateIdeas\.length\} unsaved ideas are grouped below/);
  assert.match(component, /ideas=\{visibleIdeas\}/);
  assert.doesNotMatch(component, /Regenerate batch|BROWSE_BATCH_STORAGE_KEY/);
  assert.match(component, /GALLERY_DENSITY_STORAGE_KEY/);
  assert.match(component, /aria-label="Gallery image size"/);
  assert.match(component, /Generate images with ChatGPT/);
  assert.match(component, /function ChatGPTHandoff/);
  assert.match(component, /function BatchImportDialog/);
  assert.match(component, /function parseIdeaBatchJson/);
  assert.match(component, /Import AI batch/);
  assert.match(component, /fetch\("\/api\/ideas\/batch"/);
  assert.match(component, /Return only valid JSON/);
  assert.match(component, /window\.open\("https:\/\/chatgpt\.com\//);
  assert.match(styles, /repeat\(auto-fill, minmax/);
  assert.match(styles, /\.gallery-grid\.gallery-density-5/);
});

test("documents a portable handoff and AI batch contract", async () => {
  const [handoff, agentInstructions, example] = await Promise.all([
    readFile(new URL("../HANDOFF.md", import.meta.url), "utf8"),
    readFile(new URL("../AGENTS.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/idea-batch.example.json", import.meta.url), "utf8"),
  ]);

  assert.match(handoff, /Where the data lives/);
  assert.match(handoff, /What ChatGPT hosting changes/);
  assert.match(handoff, /Import AI batch/);
  assert.match(agentInstructions, /New brainstormed ideas must be `candidate`/);
  const parsed = JSON.parse(example);
  assert.ok(Array.isArray(parsed.ideas));
  assert.ok(parsed.ideas.length > 0);
});
