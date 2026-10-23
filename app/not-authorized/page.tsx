import { chatGPTSignOutPath } from "../chatgpt-auth";

export const dynamic = "force-dynamic";

export default function NotAuthorized() {
  return (
    <main className="access-page">
      <section className="access-card" aria-labelledby="access-title">
        <span className="access-mark" aria-hidden="true">⌂</span>
        <p className="eyebrow">Private notebook</p>
        <h1 id="access-title">This House Notes belongs to a different account.</h1>
        <p>Sign out, then continue with the ChatGPT account that owns this notebook.</p>
        <a className="access-action" href={chatGPTSignOutPath("/")}>Switch ChatGPT account</a>
      </section>
    </main>
  );
}
