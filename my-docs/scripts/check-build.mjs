import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/catalog.json"), "utf8"),
);
const output = process.env.BUILD_DIR || path.join(root, "build");
const base = process.env.BASE_URL || "/manuals/";
let checks = 0;
function page(route, text) {
  const html = fs.readFileSync(path.join(output, route, "index.html"), "utf8");
  const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1];
  const escaped = text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
  assert.equal(heading, escaped, `Incorrect heading: ${route}`);
  assert(html.includes(`${base}assets/`), `Incorrect asset base URL: ${route}`);
  checks++;
  return html;
}
page("", "A place for every document.");
for (const division of catalog.divisions) {
  page(division.slug, division.name);
  for (const category of catalog.categories)
    page(`${division.slug}/${category.slug}`, category.name);
}
for (const doc of catalog.documents) {
  const html = page(`${doc.division}/${doc.category}/${doc.slug}`, doc.title);
  if (doc.file) {
    assert(
      html.includes(`${base}${doc.file}`),
      `Incorrect attachment URL: ${doc.slug}`,
    );
    assert.deepEqual(
      fs.readFileSync(path.join(output, doc.file)),
      fs.readFileSync(path.join(root, "static", doc.file)),
      `Attachment changed: ${doc.file}`,
    );
    checks++;
  }
}
assert(fs.existsSync(path.join(output, "404.html")), "Missing 404 page");
assert(fs.existsSync(path.join(output, ".nojekyll")), "Missing .nojekyll");
console.log(
  `Passed ${checks + 2} production checks: division/category/document routes, asset prefixes, attachment integrity, and GitHub Pages files.`,
);
