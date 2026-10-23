# House Notes agent instructions

Read `HANDOFF.md` before changing this project.

- Preserve owner-only authorization for the notebook and every data route.
- New brainstormed ideas must be `candidate` Browse ideas, never automatically `saved`.
- Do not expose, copy into source, or log production notes, links, image metadata, or image bytes.
- Prefer the documented JSON batch import for bulk ideas. Use `docs/idea-batch.example.json` as the contract.
- Keep category names aligned with `CATEGORIES` in `data/ideas.ts`.
- Preserve user state: seed records use `INSERT OR IGNORE`; do not add resets or blanket updates.
- Treat `.codex-remote-attachments/` and unrelated working-tree changes as user-owned.
- Run the build, tests, and lint before publishing. Use Sites for production deployment when requested.

