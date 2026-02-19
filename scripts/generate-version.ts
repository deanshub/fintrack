import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const hash = execSync("git rev-parse --short HEAD").toString().trim();
const count = execSync("git rev-list --count HEAD").toString().trim();
const version = `0.${count}.0+${hash}`;

const outPath = join(import.meta.dirname, "..", "lib", "version.ts");
writeFileSync(outPath, `export const APP_VERSION = "${version}";\n`);
console.log(`Generated version: ${version}`);
