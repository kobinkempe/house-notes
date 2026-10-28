# House Notes

**A home-ideas notebook that lives on my phone.**

I wanted a convenient place to keep inspiration for a home, so I used AI to build one. Now I use House Notes: a small notebook for photos, links, ideas and the notes that make them useful later. The goal was a tool that fits naturally into my day, especially on my phone.

## What makes it useful

- **Capture inspiration wherever I find it.** The installed Android web app accepts photos and web links through another app’s Share menu.
- **Open it from my home screen.** The private app installs as a standalone web app.
- **Add a new idea quickly.** Give it a title, choose a category and add an optional note.
- **Keep the collection organized.** Ideas appear grouped by category automatically; search and filters narrow the list.
- **Browse comfortably on a phone.** Compact rows expand for detail, and the gallery has adjustable image sizes.
- **Remember the detail that mattered.** Add and edit notes alongside ideas.

The category comes from the idea’s chosen category; this is not a claim that a model classifies every photo. Sharing means sharing *into* my private notebook, rather than publishing the notebook to other people.

## Public demo

[Open the live demo](https://kobinkempe.pages.dev/house-notes/) · [See project details](https://kobinkempe.pages.dev/projects/house-notes/)

![House Notes with example ideas](docs/screenshots/desktop.jpg)

Try adding an idea and a note, opening a category, and changing the gallery size. The demo uses example ideas and holds changes in browser memory; refresh resets it. Phone installation, Android sharing and persistent storage are features of the private installed app. The demo has no connection to my production notebook and includes none of its photos, links or notes.

## Run the portfolio demo

Requires Node.js 22.13+ and npm.

```sh
npm ci
npm run dev:demo
```

Open http://127.0.0.1:4312. The real React interface runs with in-memory API responses. No production account, API key, database or uploaded photos are needed.

## Where AI fits

I defined the everyday need and reviewed the experience. AI assisted implementation of the responsive interface, capture flows, persistence and access controls. This is an example of using AI to create a useful personal tool, rather than adding a model call to every interaction.

An optional **Import AI batch** flow accepts suggestions from an external model using [the JSON batch contract](docs/idea-batch.example.json). The importer checks fields and categories, skips duplicate titles, and puts suggestions in **Browse ideas**. A person explicitly saves an idea to **My ideas**. The app does not embed a model API or automatically send the private notebook to a model.

## Architecture and engineering decisions

- React 19 and TypeScript; vinext/Vite; Worker-compatible server output.
- SQL records in D1 through Drizzle; uploaded image bytes in R2.
- Owner authorization on the page and every data API, including image access and batch import.
- Android web-app manifest and share target for capturing inspiration.
- `INSERT OR IGNORE` seed insertion preserves existing records.

The isolated demo lives in `demo/`; the authenticated app remains in `app/`. The owner email and site origin use reserved example values. See [deployment setup](docs/DEPLOYMENT.md) to configure your own instance. Request headers are trusted only behind the intended authenticated hosting boundary; this is not a standalone authentication service.

## Verify

```sh
npm test
npm run lint
```

The build and nine tests cover rendering, owner access, protected routes, share metadata and the import contract. Lint currently has two image-optimization warnings and no errors. Persistent notebook behavior requires the intended D1/R2 environment; the browser-only demo does not verify those integrations.

## Portfolio scope

Product design for everyday use, phone capture and browsing, editable notes, access control, and persistence boundaries. Built with AI assistance; this repository does not claim model training or evaluated model accuracy. Production notes, links, uploads, environment files and deployment identifiers are excluded.
