import {
  mkdir,
  copyFile,
  readFile,
  writeFile,
  readdir,
  stat,
} from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const root = resolve(import.meta.dirname, "..");
const pkg = join(root, "node_modules/@kuntay/swisseph-data");
const manifest = JSON.parse(await readFile(join(pkg, "manifest.json"), "utf8"));
await mkdir(join(root, "public/ephemeris"), { recursive: true });
for (const name of ["sepl_18.se1", "semo_18.se1"]) {
  const bytes = await readFile(join(pkg, "ephe", name));
  if (
    createHash("sha256").update(bytes).digest("hex") !==
    manifest.files.find((f) => f.file === name).sha256
  )
    throw new Error(`Ephemeris checksum mismatch: ${name}`);
  await copyFile(join(pkg, "ephe", name), join(root, "public/ephemeris", name));
}
await copyFile(
  join(pkg, "manifest.json"),
  join(root, "public/ephemeris/manifest.json"),
);
// Provide the application's corresponding source to every deployed user. Only allowlisted paths enter this archive.
await mkdir(join(root, "public/source"), { recursive: true });
const names = [
  "src",
  "scripts",
  "supabase",
  "tests",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "vite.config.ts",
  "index.html",
  ".env.example",
  "LICENSE",
  "NOTICE",
  "README.md",
  "METHODS.md",
  "public/cities.json",
  "public/favicon.svg",
  "public/_headers",
];
const included = [];
for (const name of names) {
  try {
    await stat(join(root, name));
    included.push(name);
  } catch {
    /* Optional files are absent in early development. */
  }
}
execFileSync(
  "tar",
  ["-czf", join(root, "public/source/kanastro-source.tar.gz"), ...included],
  { cwd: root, env: { ...process.env, COPYFILE_DISABLE: "1" } },
);
await writeFile(
  join(root, "public/source/README.txt"),
  "Kanastro source, AGPL-3.0-or-later. See LICENSE and NOTICE in the archive. Ephemeris dependencies are pinned in package-lock.json. No birth records or credentials are included.\n",
);
console.log("Verified ephemeris assets and prepared source download.");
