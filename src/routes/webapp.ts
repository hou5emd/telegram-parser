import { resolve } from "node:path";

import { Elysia } from "elysia";

const webAppDistDir = resolve(process.cwd(), "dist/webapp");
const webAppIndexFile = Bun.file(resolve(webAppDistDir, "index.html"));

const getContentType = (assetName: string) => {
  if (assetName.endsWith(".css")) {
    return "text/css; charset=utf-8";
  }

  if (assetName.endsWith(".js")) {
    return "text/javascript; charset=utf-8";
  }

  return "application/octet-stream";
};

const serveIndex = async () => {
  if (!(await webAppIndexFile.exists())) {
    return new Response("Web app assets are missing. Run `bun run build:webapp` first.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(webAppIndexFile, {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
};

export const webAppRoutes = new Elysia()
  .get("/app", serveIndex)
  .get("/app/", serveIndex)
  .get("/app/:asset", async ({ params, set }) => {
    if (params.asset.includes("/") || params.asset === "index.html") {
      set.status = 404;
      return "Not found";
    }

    const file = Bun.file(resolve(webAppDistDir, params.asset));

    if (!(await file.exists())) {
      set.status = 404;
      return "Not found";
    }

    return new Response(file, {
      headers: {
        "content-type": getContentType(params.asset),
      },
    });
  });
