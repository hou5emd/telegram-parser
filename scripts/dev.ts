const children = [
  Bun.spawn(["bun", "run", "dev:webapp"], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  }),
  Bun.spawn(["bun", "run", "dev:server"], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  }),
];

let shuttingDown = false;

const shutdown = async (code = 0) => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    child.kill();
  }

  await Promise.all(children.map((child) => child.exited.catch(() => undefined)));
  process.exit(code);
};

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    void shutdown(0);
  });
}

const results = await Promise.all(children.map((child) => child.exited));
const failed = results.find((code) => code !== 0);

await shutdown(failed ?? 0);
