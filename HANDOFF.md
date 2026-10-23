# House Notes portfolio handoff

This is a sanitized source snapshot with an isolated read-only demo. Read AGENTS.md before editing. New brainstormed ideas must be `candidate`; only explicit user action saves them.

## Where the data lives

The authored seed examples live in `data/`. The production design stores records and links in D1 and image bytes in R2. No production database, uploaded image metadata, uploaded image bytes, account sessions or exports are included here. The original owner's saved seed preferences have been replaced with three neutral examples.

## What ChatGPT hosting changes

The authenticated app expects a trusted host to supply verified account headers. The owner is a reserved example email in `app/chatgpt-auth.ts`; set it deliberately for your own deployment. Never expose an origin where clients can forge trusted identity headers. Configure D1 `DB` and R2 `IDEA_IMAGES`, and set the actual public origin in `app/layout.tsx`. `.openai/hosting.json` contains only local binding names, with no Site ID or credentials. Provision a new hosting project deliberately before any deployment; never point this snapshot at the original notebook.

## Import AI batch

Use docs/idea-batch.example.json. The importer validates its input and places valid new records in Browse ideas with candidate status. It must not auto-save brainstorms. The demo shows the import dialog but rejects writes.

## Local review

Run `npm ci` and `npm run dev:demo` for the browser UI. `npm run dev` is the authenticated Worker-backed application and requires its host environment for sign-in and persistence. Run the build, tests and lint before a deployment. Existing route tests use a synthetic trusted owner header; they do not prove the identity proxy itself is secure.
