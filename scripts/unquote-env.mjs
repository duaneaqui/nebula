import { readFileSync, writeFileSync } from "node:fs";

const path = ".env.local";
const keys = new Set([
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "POSTGRES_URL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NO_SSL",
]);

const out = readFileSync(path, "utf8")
  .split(/\r?\n/)
  .map((line) => {
    const eq = line.indexOf("=");
    if (eq < 0) return line;
    const key = line.slice(0, eq);
    if (!keys.has(key)) return line;
    let value = line.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return `${key}=${value}`;
  })
  .join("\n");

writeFileSync(path, out);
const sample = out.split(/\n/).find((line) => line.startsWith("DATABASE_URL="))?.slice(13) ?? "";
console.log(
  JSON.stringify({
    first: sample[0],
    last: sample[sample.length - 1],
    quoted: sample.startsWith('"'),
  }),
);
