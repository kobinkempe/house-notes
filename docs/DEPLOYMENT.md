# House Notes deployment setup

The repository includes a browser-only demo and an authenticated application. Read [the contributor instructions](../AGENTS.md) before editing. New brainstormed ideas must be `candidate`; only explicit user action saves them.

## Where the data lives

The authored seed examples live in `data/`. The authenticated application stores records and links in D1 and image bytes in R2. The repository contains three neutral saved examples and no production database, uploaded images, account sessions or exports.

## What ChatGPT hosting changes

The authenticated app expects a trusted host to supply verified account headers. Configure the owner email in `app/chatgpt-auth.ts`, D1 `DB`, R2 `IDEA_IMAGES`, and your public origin in `app/layout.tsx`. The checked-in email and origin use reserved example values. Never expose an origin where clients can forge trusted identity headers. `.openai/hosting.json` contains local binding names; provision a hosting project for your own instance.

## Import AI batch

Use docs/idea-batch.example.json. The importer validates its input and places valid new records in Browse ideas with candidate status. It must not auto-save brainstorms. The demo supports validated imports and explicit saving in browser memory, without contacting a server or the production notebook.

## Local review

Run `npm ci` and `npm run dev:demo` for the browser UI. `npm run dev` is the authenticated Worker-backed application and requires its host environment for sign-in and persistence. Run the build, tests and lint before a deployment. Existing route tests use a synthetic trusted owner header; they do not prove the identity proxy itself is secure.
