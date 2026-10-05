// Run an extra `next dev` instance on a given port: `node scripts/dev-port.mjs 3110`.
// Each instance gets its own distDir (.next-<port>) because Next locks the dist dir per dev server.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const port = Number(process.argv[2]);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("Usage: node scripts/dev-port.mjs <port>");
  process.exit(1);
}

const nextBin = createRequire(import.meta.url).resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "-p", String(port), ...process.argv.slice(3)], {
  stdio: "inherit",
  env: {
    ...process.env,
    NEXT_DIST_DIR: `.next-${port}`,
  },
});

child.on("exit", (code, signal) => process.exit(signal ? 1 : (code ?? 0)));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
