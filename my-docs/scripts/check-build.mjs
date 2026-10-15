import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/catalog.json"), "utf8"),
);
const japanese = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/locales/ja.json"), "utf8"),
);
const output = process.env.BUILD_DIR || path.join(root, "build");
const base = process.env.BASE_URL || "/manuals/";
const homeUrl = process.env.HOME_URL || "https://kyouritsu-sysadmin.github.io/";
let checks = 0;
const escaped = (text) =>
  text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
for (const locale of ["en", "ja"]) {
  const prefix = locale === "ja" ? "ja/" : "";
  const localeBase = base + prefix;
  const directory = path.join(output, prefix);
  function page(route, text) {
    const html = fs.readFileSync(
      path.join(directory, route, "index.html"),
      "utf8",
    );
    const heading = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1];
    assert.equal(
      heading,
      escaped(text),
      `Incorrect heading: ${locale}/${route}`,
    );
    assert(
      html.includes(`lang="${locale}"`),
      `Incorrect HTML language: ${locale}/${route}`,
    );
    assert(
      html.includes(`${localeBase}assets/`),
      `Incorrect asset prefix: ${locale}/${route}`,
    );
    assert(
      html.includes(`href="${homeUrl}"`),
      `Missing root Home link: ${locale}/${route}`,
    );
    checks++;
    return html;
  }
  const home = page(
    "",
    locale === "ja"
      ? japanese.ui["A place for every document."]
      : "A place for every document.",
  );
  assert(
    home.includes(`href="${base}ja/"`),
    "Missing Japanese language switch",
  );
  for (const division of catalog.divisions) {
    const name =
      locale === "ja"
        ? japanese.divisions[division.slug]?.name || division.name
        : division.name;
    const divisionPage = page(division.slug, name);
    assert(
      home.includes(escaped(name)),
      `Division missing from home navigation: ${name}`,
    );
    assert(
      divisionPage.includes(escaped(division.romaji)),
      `Missing romaji: ${division.slug}`,
    );
    if (division.parent) {
      const breadcrumb =
        divisionPage.match(
          /<nav class="library-breadcrumb"[\s\S]*?<\/nav>/,
        )?.[0] || "";
      assert(
        breadcrumb.includes(`href="${localeBase}${division.parent}/"`),
        `Missing parent breadcrumb: ${division.slug}`,
      );
    }
    for (const child of catalog.divisions.filter(
      (item) => item.parent === division.slug,
    )) {
      const sections =
        divisionPage.match(
          /<section class="divisions-section"[\s\S]*?<\/section>/,
        )?.[0] || "";
      assert(
        sections.includes(`href="${localeBase}${child.slug}/"`),
        `Missing child section: ${division.slug}/${child.slug}`,
      );
    }
    for (const category of catalog.categories)
      page(
        `${division.slug}/${category.slug}`,
        locale === "ja"
          ? japanese.categories[category.slug]?.name || category.name
          : category.name,
      );
  }
  for (const doc of catalog.documents) {
    const id = `${doc.division}/${doc.category}/${doc.slug}`;
    const localized =
      locale === "ja" ? { ...doc, ...japanese.documents[id] } : doc;
    const html = page(id, localized.title);
    assert(
      html.includes(`href="${localeBase}${doc.division}/"`),
      `Sidebar leaves locale: ${id}`,
    );
    if (localized.file) {
      assert(
        html.includes(`${localeBase}${localized.file}`),
        `Incorrect attachment URL: ${locale}/${id}`,
      );
      assert.deepEqual(
        fs.readFileSync(path.join(directory, localized.file)),
        fs.readFileSync(path.join(root, "static", localized.file)),
        `Attachment changed: ${localized.file}`,
      );
      if (localized.format === "PDF")
        assert(
          html.includes(locale === "ja" ? "ブック表示" : "Flipbook"),
          `Missing flipbook controls: ${locale}/${id}`,
        );
      checks++;
    }
  }
  for (const file of [
    "404.html",
    ".nojekyll",
    "vendor/pdfjs/pdf.worker.min.mjs",
    "vendor/pdfjs/cmaps/UniJIS-UTF16-H.bcmap",
  ]) {
    assert(
      fs.existsSync(path.join(directory, file)),
      `Missing runtime file: ${locale}/${file}`,
    );
    checks++;
  }
}
console.log(
  `Passed ${checks} production checks across English and Japanese: routes, localized navigation, PDF controls, attachments, workers, and Japanese CMaps.`,
);
