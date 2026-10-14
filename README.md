# Kyoritsu document library

A minimal Docusaurus website for company manuals, PDFs, guides, and downloadable documents. The application is in [`my-docs/`](my-docs/). Existing flipbook source assets are retained; GitHub Pages now builds the Docusaurus application.

## Local development

Requires Node.js 24 and npm.

```sh
cd my-docs
npm ci
npm start
```

The local library is at `http://localhost:3000/manuals/`. The homepage includes document search (metadata, not PDF full text), format filters, and division navigation. PDF pages have a native browser preview, an original-file link, and a download action. Other file types can be downloaded, while Markdown/MDX guides render as web pages.

## URL structure

The existing Git remote is `kyouritsu-sysadmin/manuals`; its GitHub Pages prefix is `/manuals/`:

- `/manuals/` — all divisions and documents
- `/manuals/sales/` — Sales overview
- `/manuals/sales/manual/` — Sales manuals
- `/manuals/sales/manual/sales-training/` — existing Japanese PDF
- `/manuals/sales/guides/getting-started/` — sample web document

Each division has its own Manuals, Guides, Policies, and Forms pages, including an empty state when no documents exist. Document URLs work when opened directly or refreshed. For a domain served at its root, build with `BASE_URL=/ SITE_URL=https://docs.example.com npm run build`.

## Add or rename divisions

Edit `my-docs/src/data/catalog.json`. There are 23 spaces: Sales and 22 explicit placeholders. Replace placeholder names, descriptions, and slugs with your actual divisions, and remove `"placeholder": true`. Slugs use lowercase letters, numbers, and hyphens. Update document division references when changing a slug. Treat published slugs as permanent so shared links keep working. More divisions can be added without changing React components.

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

The catalog generator rejects duplicate or invalid slugs, unknown divisions/categories, missing content files, and missing required metadata. The production check verifies all division/category/document pages, base URLs, attachment integrity, the 404 page, and `.nojekyll`.

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
- The new PDF preview uses the browser's reader. Page-turn animation is not part of the new library.
- Docusaurus tutorial and blog examples are archived in `my-docs/legacy/` and excluded from the site. There is one clearly labeled sample guide, with no invented company policy.
- Existing root PDF.js, images, and other flipbook assets remain untouched and are not copied into the new build.

References: [Docusaurus deployment](https://docusaurus.io/docs/deployment), [Docusaurus documentation routes](https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-content-docs).
