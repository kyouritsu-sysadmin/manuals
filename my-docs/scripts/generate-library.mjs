import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/catalog.json"), "utf8"),
);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const seen = new Set();
function assert(ok, message) {
  if (!ok) throw new Error(message);
}
for (const [kind, entries] of [
  ["division", catalog.divisions],
  ["category", catalog.categories],
]) {
  const ids = new Set();
  for (const entry of entries) {
    assert(
      slugPattern.test(entry.slug) && !ids.has(entry.slug),
      `Invalid or duplicate ${kind}: ${entry.slug}`,
    );
    assert(entry.name, `Missing ${kind} name`);
    ids.add(entry.slug);
  }
}
function inputFile(relative, folder) {
  assert(typeof relative === "string", "A file path is required");
  const base = path.join(root, folder);
  const target = path.resolve(base, relative);
  assert(
    target.startsWith(base + path.sep) && fs.statSync(target).isFile(),
    `Missing or unsafe file: ${relative}`,
  );
  return target;
}
const pages = [];
for (const doc of catalog.documents) {
  assert(
    catalog.divisions.some((d) => d.slug === doc.division),
    `Unknown division: ${doc.division}`,
  );
  assert(
    catalog.categories.some((c) => c.slug === doc.category),
    `Unknown category: ${doc.category}`,
  );
  assert(slugPattern.test(doc.slug), `Invalid document slug: ${doc.slug}`);
  const id = `${doc.division}/${doc.category}/${doc.slug}`;
  assert(!seen.has(id), `Duplicate document: ${id}`);
  seen.add(id);
  assert(
    doc.title && doc.description && doc.language,
    `Missing metadata: ${id}`,
  );
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(doc.updated) &&
      !Number.isNaN(Date.parse(doc.updated)),
    `Invalid date: ${id}`,
  );
  assert(
    ["PDF", "Guide", "File"].includes(doc.format),
    `Unknown format: ${id}`,
  );
  assert(doc.file || doc.source, `No content or file: ${id}`);
  if (doc.format === "PDF")
    assert(doc.file?.endsWith(".pdf"), `PDF file required: ${id}`);
  if (doc.file) inputFile(doc.file, "static");
  const body = doc.source
    ? fs.readFileSync(inputFile(doc.source, ""), "utf8")
    : "";
  assert(
    !body.startsWith("---"),
    `Keep metadata in catalog.json, not source front matter: ${id}`,
  );
  const attachment = doc.file
    ? `\nimport DocumentFile from '@site/src/components/DocumentFile';\n\n<DocumentFile path={${JSON.stringify(doc.file)}} title={${JSON.stringify(doc.title)}} pdf={${doc.format === "PDF"}} />\n`
    : "";
  pages.push({
    id,
    text: `---\ntitle: ${JSON.stringify(doc.title)}\ndescription: ${JSON.stringify(doc.description)}\nslug: /${id}\nhide_table_of_contents: ${Boolean(doc.file)}\n---\n\n<div className="document-meta">${doc.format} · ${doc.language} · Updated ${doc.updated}${doc.sample ? " · Sample guide" : ""}</div>\n\n${doc.description}\n\n${body}\n${attachment}`,
  });
}
const out = path.join(root, ".generated-docs");
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const { id, text } of pages) {
  const file = path.join(out, id + ".mdx");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
console.log(
  `Validated ${catalog.divisions.length} divisions and generated ${pages.length} documents.`,
);
