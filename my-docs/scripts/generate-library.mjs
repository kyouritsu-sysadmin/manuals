import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Share the portal's self-hosted fonts and palette with the manuals deployment.
fs.cpSync(
  path.join(root, "../portal/src/fonts"),
  path.join(root, "static/fonts"),
  { recursive: true },
);
fs.copyFileSync(
  path.join(root, "../portal/src/theme.css"),
  path.join(root, "static/theme.css"),
);
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
for (const division of catalog.divisions) {
  assert(
    division.japanese && division.romaji,
    `Missing division names: ${division.slug}`,
  );
  const ancestors = new Set([division.slug]);
  let parent = division.parent;
  while (parent) {
    const entry = catalog.divisions.find((item) => item.slug === parent);
    assert(entry, `Unknown parent division: ${parent}`);
    assert(
      !ancestors.has(parent),
      `Circular division hierarchy: ${division.slug}`,
    );
    ancestors.add(parent);
    parent = entry.parent;
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
const japanese = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/locales/ja.json"), "utf8"),
);
// Keep document sidebar labels aligned with renamed departments and ancestors.
const sidebarTranslations = {};
for (const division of catalog.divisions) {
  assert(
    japanese.divisions[division.slug]?.name === division.japanese,
    `Japanese division name mismatch: ${division.slug}`,
  );
  sidebarTranslations[`sidebar.${division.slug}.link.← All divisions`] = {
    message: "← すべての部門",
  };
  let ancestor = division;
  while (ancestor) {
    sidebarTranslations[
      `sidebar.${division.slug}.link.${ancestor.name} overview`
    ] = {
      message: `${japanese.divisions[ancestor.slug].name}の資料`,
    };
    ancestor = catalog.divisions.find((item) => item.slug === ancestor.parent);
  }
  for (const category of catalog.categories)
    sidebarTranslations[`sidebar.${division.slug}.category.${category.name}`] =
      {
        message: japanese.categories[category.slug]?.name || category.name,
      };
}
fs.writeFileSync(
  path.join(root, "i18n/ja/docusaurus-plugin-content-docs/current.json"),
  JSON.stringify(sidebarTranslations, null, 2) + "\n",
);
const pages = [];
const japanesePages = [];
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
  function makePage(document, content, ja = false) {
    const attachment = document.file
      ? `\nimport DocumentFile from '@site/src/components/DocumentFile';\n\n<DocumentFile path={${JSON.stringify(document.file)}} title={${JSON.stringify(document.title)}} pdf={${document.format === "PDF"}} />\n`
      : "";
    return {
      id,
      text: `---\ntitle: ${JSON.stringify(document.title)}\ndescription: ${JSON.stringify(document.description)}\nslug: /${id}\nhide_table_of_contents: ${Boolean(document.file)}\n---\n\n<div className="document-meta">${ja ? japanese.ui[document.format] || document.format : document.format} · ${document.language} · ${ja ? "更新日" : "Updated"} ${document.updated}${document.sample ? (ja ? " · サンプルガイド" : " · Sample guide") : ""}</div>\n\n${document.description}\n\n${content}\n${attachment}`,
    };
  }
  pages.push(makePage(doc, body));
  const translated = { ...doc, ...japanese.documents[id] };
  if (translated.file) inputFile(translated.file, "static");
  const translatedBody = translated.source
    ? fs.readFileSync(inputFile(translated.source, ""), "utf8")
    : "";
  japanesePages.push(makePage(translated, translatedBody, true));
}
for (const [folder, documents] of [
  [".generated-docs", pages],
  ["i18n/ja/docusaurus-plugin-content-docs/current", japanesePages],
]) {
  const out = path.join(root, folder);
  fs.rmSync(out, { recursive: true, force: true });
  for (const { id, text } of documents) {
    const file = path.join(out, id + ".mdx");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
}
// Serve a matching PDF.js worker, CMaps, and fonts from this site in both locales.
const pdfjs = path.join(root, "node_modules/pdfjs-dist");
const vendor = path.join(root, "static/vendor/pdfjs");
fs.mkdirSync(vendor, { recursive: true });
fs.copyFileSync(
  path.join(pdfjs, "build/pdf.worker.min.mjs"),
  path.join(vendor, "pdf.worker.min.mjs"),
);
fs.copyFileSync(path.join(pdfjs, "LICENSE"), path.join(vendor, "LICENSE"));
for (const name of ["cmaps", "standard_fonts", "wasm", "iccs"]) {
  fs.cpSync(path.join(pdfjs, name), path.join(vendor, name), {
    recursive: true,
  });
}
console.log(
  `Validated ${catalog.divisions.length} divisions; generated ${pages.length} documents in English and Japanese, plus PDF.js assets.`,
);

// page-flip 2.0.7 leaves its animation loop running after destroy().
// Patch a generated copy, retaining the pinned upstream package and license.
const flipSource = fs.readFileSync(
  path.join(root, "node_modules/page-flip/dist/js/page-flip.module.js"),
  "utf8",
);
const loop =
  "start(){this.update();const t=e=>{this.render(e),requestAnimationFrame(t)};requestAnimationFrame(t)}";
const cleanup = "destroy(){this.ui.destroy(),this.block.remove()}";
assert(
  flipSource.includes(loop) && flipSource.includes(cleanup),
  "Recheck the page-flip lifecycle patch after upgrading",
);
const patched = flipSource
  .replace(
    loop,
    "start(){this.update();const t=e=>{if(this.disposed)return;this.render(e);this.frameId=requestAnimationFrame(t)};this.frameId=requestAnimationFrame(t)}stop(){this.disposed=true;cancelAnimationFrame(this.frameId)}",
  )
  .replace(
    cleanup,
    "destroy(){this.render.stop();this.ui.destroy();this.block.remove()}",
  );
const flipVendor = path.join(root, ".generated-vendor");
fs.mkdirSync(flipVendor, { recursive: true });
const flipLicense = fs.readFileSync(
  path.join(root, "node_modules/page-flip/LICENSE"),
  "utf8",
);
fs.writeFileSync(
  path.join(flipVendor, "page-flip.js"),
  `/*!\n${flipLicense}\n*/\n${patched}`,
);
fs.copyFileSync(
  path.join(root, "node_modules/page-flip/LICENSE"),
  path.join(flipVendor, "LICENSE"),
);
