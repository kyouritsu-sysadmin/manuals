import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  divisionTrail,
  withinDivision,
  divisionMatches,
} from "../src/data/hierarchy.ts";

const { divisions, documents } = JSON.parse(
  fs.readFileSync(new URL("../src/data/catalog.json", import.meta.url)),
);

test("company tree has all 25 entries and the supplied section groups", () => {
  assert.equal(divisions.length, 25);
  assert.equal(divisions.filter((item) => !item.parent).length, 13);
  const groups = {
    design: ["電気設計課", "構造設計課"],
    "production-management": ["工程課", "資材課"],
    manufacturing: ["加工課", "フレーム課", "薄物1課", "塗装課"],
    wiring: ["A-1課", "A-2課（A-3課）", "B-1課（B-2課）", "B-3課"],
  };
  for (const [parent, names] of Object.entries(groups))
    assert.deepEqual(
      divisions
        .filter((item) => item.parent === parent)
        .map((item) => item.japanese),
      names,
    );
});

test("section trails preserve order and department scope excludes siblings", () => {
  assert.deepEqual(
    divisionTrail(divisions, "electrical-design").map((item) => item.slug),
    ["design", "electrical-design"],
  );
  assert(withinDivision(divisions, "electrical-design", "design"));
  assert(withinDivision(divisions, "design", "design"));
  assert(!withinDivision(divisions, "structural-design", "electrical-design"));
  assert(!withinDivision(divisions, "wiring-a1", "design"));
  assert(withinDivision(divisions, "wiring-a1"));
  // Exercise descendants beyond the current two-level company structure.
  const nested = [...divisions, { slug: "team", parent: "electrical-design" }];
  assert(withinDivision(nested, "team", "design"));
});

test("names are searchable across languages and without romaji macrons", () => {
  const structural = divisions.find(
    (item) => item.slug === "structural-design",
  );
  for (const query of ["Structural", "構造設計", "Kozo", "Kōzō"])
    assert(divisionMatches(structural, query), query);
  assert(
    divisionMatches(
      {
        ...structural,
        name: structural.japanese,
        englishName: structural.name,
      },
      "structural",
    ),
  );
  assert(
    divisionMatches(
      divisions.find((item) => item.slug === "tokyo"),
      "Ｔｏｋｙｏ",
    ),
  );
  assert(!divisionMatches(structural, "wiring"));
});

test("Head Office Sales keeps the existing document paths", () => {
  const sales = divisions.find((item) => item.slug === "sales");
  assert.equal(sales.name, "Head Office Sales");
  assert.equal(sales.japanese, "本社営業");
  assert(
    documents.some(
      (doc) =>
        `${doc.division}/${doc.category}/${doc.slug}` ===
        "sales/manual/sales-training",
    ),
  );
});
