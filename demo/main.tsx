import React from "react";
import { createRoot } from "react-dom/client";
import HouseNotes from "../app/HouseNotes";
import { ALL_IDEAS } from "../data/ideas";
import "../app/globals.css";

// This isolated entry point never contacts the production notebook. It mounts
// the real component with synthetic seed data and read-only API responses.
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url, location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith("/api/")) return nativeFetch(input, init);
  if ((init?.method || (input instanceof Request ? input.method : "GET")) !== "GET")
    return Response.json({ error: "This portfolio demo is read-only." }, { status: 405 });
  if (url.pathname === "/api/ideas") return Response.json({ ideas: ALL_IDEAS.map((idea, sortOrder) => ({ ...idea, note: "", sortOrder })) });
  if (url.pathname === "/api/images") return Response.json({ images: [] });
  if (url.pathname === "/api/links") return Response.json({ links: [] });
  return Response.json({ error: "Unavailable in the demo" }, { status: 404 });
};
createRoot(document.getElementById("root")!).render(<React.StrictMode>
  <div style={{padding:"10px 24px",background:"#173d32",color:"white",fontFamily:"system-ui"}}>Portfolio demo · synthetic saved ideas · read-only · no production connection</div>
  <HouseNotes />
</React.StrictMode>);
