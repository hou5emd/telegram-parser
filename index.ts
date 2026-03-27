import { env } from "./src/config/env";
import { initializeRuntime } from "./src/runtime";

await initializeRuntime();

const { app } = await import("./src/app");

app.listen(
  {
    port: env.port,
    hostname: env.host,
  },
  ({ hostname, port }) => {
    console.log(`Elysia server is running at http://${hostname}:${port} [${env.nodeEnv}]`);
  }
);
