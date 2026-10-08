import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const p = path.join(
  process.env.TEMP || "",
  "athena-exact-replica-ref/Extension/roles edit_files/non_clinician.html"
);
const h = fs.readFileSync(p, "utf8");
const roles = new Set();
for (const m of h.matchAll(/>(\*[^<]{2,120})</g)) roles.add(m[1].trim());
for (const m of h.matchAll(/label="([^"]{2,120})"/g)) {
  const name = m[1].trim();
  if (name.startsWith("*") || name.includes("Worklist")) roles.add(name);
}
const uniq = [...roles].sort();
fs.writeFileSync(
  path.join(__dirname, "..", "fixture-roles.json"),
  JSON.stringify(uniq, null, 2)
);
console.log("total", uniq.length);
console.log(uniq.slice(0, 20).join("\n"));
