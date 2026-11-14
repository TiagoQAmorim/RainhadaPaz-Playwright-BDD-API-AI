/**
 * Build de produção. Na Railway, o volume /data não existe na fase de build:
 * criamos SQLite temporário e sobrescrevemos DATABASE_URL antes do `next build`.
 */
import { spawnSync } from "node:child_process";

const BUILD_DB_URL = "file:./.railway-build.db";
const onRailway = Boolean(
  process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_ENVIRONMENT_NAME ||
    process.env.RAILWAY_SERVICE_ID,
);

const env = { ...process.env };

if (onRailway) {
  env.DATABASE_URL = BUILD_DB_URL;
  console.log("[build] Railway: prisma db push em SQLite temporário…");
  const push = spawnSync("npx", ["prisma", "db", "push"], {
    stdio: "inherit",
    env,
    shell: true,
  });
  if (push.status !== 0) process.exit(push.status ?? 1);
}

console.log(onRailway ? "[build] next build (DATABASE_URL temporário)" : "[build] next build");
const build = spawnSync("npx", ["next", "build"], {
  stdio: "inherit",
  env,
  shell: true,
});

process.exit(build.status ?? 1);