import { Elysia } from "elysia";

const htmlFile = Bun.file(new URL("../webapp/index.html", import.meta.url));
const cssFile = Bun.file(new URL("../webapp/app.css", import.meta.url));
const jsFile = Bun.file(new URL("../webapp/app.js", import.meta.url));

export const webAppRoutes = new Elysia()
  .get("/app", () => new Response(htmlFile, { headers: { "content-type": "text/html; charset=utf-8" } }))
  .get("/app.css", () => new Response(cssFile, { headers: { "content-type": "text/css; charset=utf-8" } }))
  .get("/app.js", () => new Response(jsFile, { headers: { "content-type": "text/javascript; charset=utf-8" } }));
