import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const rootDir = process.cwd();
const entrypoint = resolve(rootDir, "src/webapp/index.html");
const outdir = resolve(rootDir, "dist/webapp");

rmSync(outdir, { recursive: true, force: true });
mkdirSync(outdir, { recursive: true });

const result = await Bun.build({
  entrypoints: [entrypoint],
  outdir,
  minify: true,
  publicPath: "/app/",
  target: "browser",
});

if (!result.success) {
  for (const log of result.logs) {
    console.error(log);
  }

  process.exit(1);
}

console.log(`Webapp build complete: ${outdir}`);
