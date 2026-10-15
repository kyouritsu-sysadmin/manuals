import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const config = JSON.parse(
  fs.readFileSync(path.join(root, "portal.config.json"), "utf8"),
);
const output = path.join(root, "dist");
const text = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const labels = {
  en: {
    title: "Home",
    skip: "Skip to content",
    workspace: "THE KYORITSU WORKSPACE",
    heading: "Everything you need.<br><span>One place to start.</span>",
    intro:
      "Your company resources, brought together. Choose a space below to find what you need and get back to your work.",
    resources: "Your resources",
    available: "Ready to explore",
    planned: "Coming soon",
    navigation: "Main navigation",
    language: "Language",
    note: "A shared starting point for every team.",
    footer: "Kyoritsu · Company resources",
    home: "Home",
    manuals: "Manuals",
    section: "Explore the workspace",
  },
  ja: {
    title: "ホーム",
    skip: "本文へスキップ",
    workspace: "KYORITSU ワークスペース",
    heading: "必要な情報を、<br><span>ここから。</span>",
    intro:
      "社内のリソースをひとつに。目的に合ったスペースを選んで、必要な情報や資料を見つけましょう。",
    resources: "リソース",
    available: "利用できます",
    planned: "準備中",
    navigation: "メインナビゲーション",
    language: "言語",
    note: "すべてのチームのための、共通の入口。",
    footer: "共立 · 社内リソース",
    home: "ホーム",
    manuals: "マニュアル",
    section: "ワークスペースを探す",
  },
};
const icons = {
  training: '<path d="m2 9 11-5 11 5-11 5zM6 11v7c4 4 10 4 14 0v-7M24 9v9"/>',
  map: '<path d="m3 6 7-3 6 3 7-3v18l-7 3-6-3-7 3zM10 3v18M16 6v18"/>',
  book: '<path d="M4 5h6a3 3 0 0 1 3 3v13a4 4 0 0 0-4-2H4zM22 5h-6a3 3 0 0 0-3 3v13a4 4 0 0 1 4-2h5z"/>',
  file: '<path d="M7 3h9l5 5v15H7zM16 3v6h5M10 13h8M10 17h6"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="15" y="4" width="7" height="7" rx="1"/><rect x="4" y="15" width="7" height="7" rx="1"/><rect x="15" y="15" width="7" height="7" rx="1"/>',
};
const ids = new Set();
for (const card of config.cards) {
  if (!/^[a-z0-9-]+$/.test(card.id) || ids.has(card.id))
    throw new Error(`Invalid/duplicate card ID: ${card.id}`);
  ids.add(card.id);
  if (!["available", "planned"].includes(card.status) || !icons[card.icon])
    throw new Error(`Invalid card: ${card.id}`);
  for (const locale of ["en", "ja"]) {
    if (!card.title?.[locale] || !card.description?.[locale])
      throw new Error(`Missing ${locale} card text: ${card.id}`);
    if (
      card.status === "available" &&
      (!card.button?.[locale] ||
        !/^(\/(?!\/)|https:\/\/)/.test(card.href?.[locale] || ""))
    )
      throw new Error(`Missing or unsafe card link: ${card.id}`);
  }
}
function cardMarkup(card, locale) {
  const available = card.status === "available";
  const ui = labels[locale];
  return `<article class="resource-card ${available ? "available" : "planned"}" aria-labelledby="${card.id}-title">
    <div class="card-top"><div class="card-icon"><svg viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">${icons[card.icon]}</svg></div><span class="status ${available ? "live" : ""}">${available ? '<i aria-hidden="true"></i>' : ""}${ui[card.status]}</span></div>
    <h3 id="${card.id}-title">${text(card.title[locale])}</h3><p>${text(card.description[locale])}</p>
    <div class="card-action">${available ? `<a class="button" href="${text(card.href[locale])}">${text(card.button[locale])}<span aria-hidden="true">↗</span></a>` : `<button class="button" type="button" disabled>${ui.planned}<span aria-hidden="true">→</span></button>`}</div>
  </article>`;
}
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(path.join(output, "assets"), { recursive: true });
for (const file of ["styles.css", "logo.svg"])
  fs.copyFileSync(
    path.join(root, "src", file),
    path.join(output, "assets", file),
  );
fs.writeFileSync(path.join(output, ".nojekyll"), "");
for (const locale of ["en", "ja"]) {
  const ui = labels[locale];
  const home = locale === "ja" ? "/ja/" : "/";
  const manuals = locale === "ja" ? "/manuals/ja/" : "/manuals/";
  const html = `<!doctype html>
<html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${ui.title} | Kyoritsu</title><meta name="description" content="${text(ui.intro)}"><link rel="canonical" href="${text(config.siteUrl + home)}"><link rel="alternate" hreflang="en" href="${text(config.siteUrl)}/"><link rel="alternate" hreflang="ja" href="${text(config.siteUrl)}/ja/"><link rel="icon" type="image/svg+xml" href="/assets/logo.svg"><link rel="stylesheet" href="/assets/styles.css"></head>
<body><a class="skip-link" href="#main">${ui.skip}</a>
<header class="site-header"><div class="header-inner"><a class="brand" href="${home}" aria-label="Kyoritsu ${ui.home}"><img src="/assets/logo.svg" width="34" height="34" alt=""><span>${text(config.name)}</span></a><nav aria-label="${ui.navigation}"><a href="${home}" class="active" aria-current="page">${ui.home}</a><a href="${manuals}">${ui.manuals}</a></nav><div class="language" role="group" aria-label="${ui.language}"><a href="/" lang="en" ${locale === "en" ? 'aria-current="page"' : ""}>EN</a><span aria-hidden="true">/</span><a href="/ja/" lang="ja" ${locale === "ja" ? 'aria-current="page"' : ""}>日本語</a></div></div></header>
<main id="main"><section class="hero" aria-labelledby="welcome"><p class="eyebrow">${ui.workspace}</p><h1 id="welcome">${ui.heading}</h1><p class="intro">${ui.intro}</p><div class="hero-detail"><span></span>${ui.note}</div></section>
<section class="resources" aria-labelledby="resources"><div class="section-heading"><h2 id="resources">${ui.resources}</h2><span>${ui.section}</span></div><div class="card-grid">${config.cards.map((card) => cardMarkup(card, locale)).join("\n")}</div></section>
</main><footer><div><span>${ui.footer}</span><span>${ui.note}</span></div></footer></body></html>`;
  const directory = path.join(output, locale === "ja" ? "ja" : "");
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, "index.html"), html);
}
console.log(
  `Built English and Japanese home pages with ${config.cards.length} resource cards in portal/dist.`,
);
