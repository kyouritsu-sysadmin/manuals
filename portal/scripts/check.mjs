import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "portal.config.json"), "utf8"),
);
for (const locale of ["en", "ja"]) {
  const html = fs.readFileSync(
    path.join(root, "dist", locale === "ja" ? "ja/index.html" : "index.html"),
    "utf8",
  );
  assert(html.includes(`<html lang="${locale}">`));
  assert(
    html.includes(`href="${locale === "ja" ? "/manuals/ja/" : "/manuals/"}"`),
    "Manuals must lead to the existing library",
  );
  assert.equal((html.match(/<article /g) || []).length, config.cards.length);
  assert.equal(
    (html.match(/type="button" disabled/g) || []).length,
    config.cards.filter((card) => card.status === "planned").length,
  );
  assert(!html.includes("undefined"));
  for (const asset of ["styles.css", "logo.svg"])
    assert(fs.existsSync(path.join(root, "dist/assets", asset)));
}
assert(fs.existsSync(path.join(root, "dist/.nojekyll")));
console.log(
  "Verified both home pages, Manuals destinations, planned card states, and assets.",
);
