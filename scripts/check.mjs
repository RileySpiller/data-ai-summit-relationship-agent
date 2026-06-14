import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "src/app.js",
  "src/styles.css",
  "data/sample-notes.js",
  "data/target-companies.js",
  "scripts/classify-notes.mjs",
  "scripts/serve.mjs",
  "README.md"
];

for (const file of requiredFiles) {
  await access(file);
}

const html = await readFile("index.html", "utf8");
const js = await readFile("src/app.js", "utf8");

if (!html.includes("Data + AI Summit Relationship Agent")) {
  throw new Error("Missing app title.");
}

if (!js.includes("draftFollowUp")) {
  throw new Error("Missing follow-up generator.");
}

console.log(`Checked ${requiredFiles.length} files. App scaffold looks good.`);
