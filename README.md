# Kyoritsu document library

A minimal Docusaurus website for company manuals, PDFs, guides, and downloadable documents. The application is in [`my-docs/`](my-docs/). Existing flipbook source assets are retained; GitHub Pages now builds the Docusaurus application.

## Local development

Requires Node.js 24 and npm.

```sh
cd my-docs
npm ci
npm start
```

The local library is at `http://localhost:3000/manuals/`. The homepage includes document search (metadata, not PDF full text), format filters, and division navigation. PDF pages open in a self-hosted flipbook with page-turn animation, thumbnails, page-number jumps, keyboard navigation, zoom, and fullscreen (with an expanded-view fallback). A Standard PDF tab provides the browser reader for text selection, search, and printing. Open and download actions remain available. Other file types can be downloaded, while Markdown/MDX guides render as web pages.

## URL structure

The existing Git remote is `kyouritsu-sysadmin/manuals`; its GitHub Pages prefix is `/manuals/`:

- `/manuals/` — all divisions and documents
- `/manuals/sales/` — Head Office Sales overview
- `/manuals/sales/manual/` — Head Office Sales manuals
- `/manuals/sales/manual/sales-training/` — existing Japanese PDF
- `/manuals/sales/guides/getting-started/` — sample web document

Each division has its own Manuals, Guides, Policies, and Forms pages, including an empty state when no documents exist. Document URLs work when opened directly or refreshed. For a domain served at its root, build with `BASE_URL=/ SITE_URL=https://docs.example.com npm run build`.

## Add or rename divisions

Edit `my-docs/src/data/catalog.json`. The company directory contains 25 entries: 13 top-level departments, groups, and branches and 12 child sections. Each entry has an English `name`, `japanese` name, and `romaji`; sections reference their department using `parent`. Japanese display text lives in `src/data/locales/ja.json`. The generator validates parent references, cycles, and Japanese names and refreshes document sidebar translations.

The navigation and department cards show the hierarchy. Department libraries include documents from their sections; each section also has its own library. Search accepts English, Japanese, and romaji, with or without macrons. For example, `/manuals/design/` contains links to `/manuals/electrical-design/` and `/manuals/structural-design/`.

Head Office Sales (本社営業) retains the `sales` slug and all existing document URLs. New entries use descriptive, lowercase slugs. Treat published slugs as permanent so shared links keep working; document records use the owning department or section slug. Empty placeholder URLs (`division-02` through `division-23`) have been replaced by the named libraries.

## Add a PDF

1. Put the file in `my-docs/static/files/<division>/`, preferably with an ASCII filename.
2. Add an entry to `documents` in `my-docs/src/data/catalog.json`:

```json
{
  "slug": "product-reference",
  "division": "sales",
  "category": "manual",
  "title": "Product reference",
  "description": "A short description that helps colleagues find this manual.",
  "format": "PDF",
  "language": "English",
  "updated": "2026-10-15",
  "file": "files/sales/product-reference.pdf"
}
```

3. Run `npm run build` from `my-docs`. It appears in navigation and search automatically at `/manuals/sales/manual/product-reference/`.

The supplied Japanese PDF is copied unchanged to `static/files/sales/sales-training-ja.pdf`; its original file is retained at the repository root. The date in the catalog comes from its filename.

## Add a web guide or other attachment

Create a Markdown or MDX file under `my-docs/content/<division>/<category>/`. Do not add front matter; the catalog owns its metadata. Add a document entry with `"format": "Guide"` and a `"source"` such as `"content/sales/guides/onboarding.md"`. Source paths are relative to `my-docs`.

For Word, Excel, or other downloads, put the file under `static/files/`, use `"format": "File"`, and specify `"file"`. Optional `"source"` adds instructions above an attachment. PDFs use `"format": "PDF"` to enable their preview. Add more categories to the catalog as needed. Restart `npm start` after editing the catalog or content; the generator runs before start, build, and typecheck. Do not edit `.generated-docs` directly.

## Validate

```sh
cd my-docs
npm run typecheck
npm run build
npm run check:build
```

The catalog generator rejects duplicate or invalid slugs, unknown divisions/categories, missing content files, and missing required metadata. The production check verifies both English and Japanese division/category/document pages, localized links, asset URLs, attachment integrity, PDF.js runtime files, the 404 page, and `.nojekyll`.

## Manually publish to GitHub Pages

The workflow in `.github/workflows/pages.yml` builds pull requests and publishes only when manually triggered from the repository's default branch.

1. Commit and push these changes to the default branch of `kyouritsu-sysadmin/manuals` (currently `master`).
2. In GitHub, open **Settings → Pages → Build and deployment → Source**, and select **GitHub Actions**. This replaces any old branch-based flipbook deployment.
3. Open **Actions → Build and publish document library → Run workflow** and choose the default branch.
4. After deployment succeeds, open `https://kyouritsu-sysadmin.github.io/manuals/`.

To update documents later, commit the catalog/content/file changes and run the workflow again. Pushes alone do not publish. The workflow grants Pages deployment permissions only to its deployment job. To roll back, revert to the last working source commit on the default branch and run the workflow again.

There is no sign-in layer in this static site. Use it only for documents appropriate for the visibility of your GitHub Pages deployment.

## Migration notes

- The unmodified old viewer files that were in `my-docs/static/` are preserved in `my-docs/legacy/`, outside the deployed output. Their `index.html` conflicted with the new homepage; the old PDF component also referenced a nonexistent viewer path.
- The default PDF preview uses PDF.js and page-flip for a responsive animated flipbook. Standard PDF mode uses the browser reader. Switching modes preserves the last flipbook page; page changes inside the browser reader cannot be read back by the site.
- Docusaurus tutorial and blog examples are archived in `my-docs/legacy/` and excluded from the site. There is one clearly labeled sample guide, with no invented company policy.
- Existing root PDF.js, images, and other flipbook assets remain untouched and are not copied into the new build.

References: [Docusaurus deployment](https://docusaurus.io/docs/deployment), [Docusaurus documentation routes](https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs).

## Japanese localization

English remains at `/manuals/`; Japanese is built at `/manuals/ja/`. The language menu preserves the current document route. Run `npm run build` to build both locales, or `npm start -- --locale ja` for Japanese development.

- Edit custom interface and catalog translations in `my-docs/src/data/locales/ja.json`. Division/category keys are their slugs; document keys are `<division>/<category>/<slug>`.
- Add Japanese Markdown/MDX under `my-docs/content/ja/` and set its `source` in the matching Japanese document entry. Missing translations fall back to the English catalog/content.
- Docusaurus navigation and sidebar translations live under `my-docs/i18n/ja/`.
- The `i18n/ja/docusaurus-plugin-content-docs/current/` folder is generated before start/build/typecheck; edit `content/ja/` and translation metadata instead.
- Changing the interface language does not translate or replace an attached PDF. Both locales use the same original PDF unless its catalog attachment is changed.

## Flipbook implementation

The browser downloads PDF.js and its worker, fonts, CMaps, and WASM from this site; no Google Drive integration or external viewer/CDN is used. The generator copies matching runtime files from the pinned PDF.js package. Node.js 24 is required. Nearby pages are rendered into bounded bitmaps and old bitmaps are released; thumbnails render when their panel scrolls into view. Standard PDF mode remains available for selectable text, PDF search, browser printing, and preview failures.

`page-flip@2.0.7` does not stop its animation loop when destroyed. The generator applies a small, checked lifecycle fix to a generated copy and preserves its license. Recheck that patch when upgrading the package. Never edit generated assets directly.

## Company home page

A separate, minimal company home page is in [`portal/`](portal/README.md). It has four cards: **Manuals**, **Training Guide**, **Company Map**, and **Company Official Documents**. Manuals opens `/manuals/` (or `/manuals/ja/` from the Japanese home page). The remaining cards are marked as coming soon until their destinations are configured.

The manuals' KYORITSU header and document breadcrumb Home icon return to `https://kyouritsu-sysadmin.github.io/`. There is no separate Home button in the manuals navigation. `HOME_URL` can override this destination for a local preview or another domain.

The root home page must be published from `kyouritsu-sysadmin/kyouritsu-sysadmin.github.io`; deploying the existing `manuals` repository cannot populate the root address. The portal directory includes a standalone build, a manual Pages workflow, and [deployment instructions](portal/README.md). Existing manuals and Japanese document URLs remain unchanged.

Build only the home site with `npm run build:portal` from `my-docs/`. To preview Home → Manuals → Home locally, run `npm run build:preview` and serve `portal/.preview/` as described in the portal guide.

## Visual theme and fonts

The homepage and library use the shared blue palette in `portal/src/theme.css`: Snow `#F2F5FC`, Mist `#D6DFEF`, Ice `#B1CAEC`, Sky `#88AFDD`, Blue `#628FC8`, and Deep Blue `#395780`. White cards and PDF paper use dark ink `#24364B`; secondary text uses `#4C617B` for contrast. Deep blue is used for primary actions, selection indicators, and keyboard focus.

Mona Sans is used for body text and navigation, Hubot Sans for headings and branding, and Noto Sans JP for Japanese glyphs. Font assets and licenses are bundled in `portal/src/fonts/`; there are no runtime CDN requests. Unicode subsets load only as needed. The manuals generator copies the shared theme and fonts into `static/`, and the portal build includes them under `assets/`. Update the standalone homepage repository with the same portal source changes when publishing a theme update to both sites.
