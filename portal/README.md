# Kyoritsu home page

The home page belongs at `https://kyouritsu-sysadmin.github.io/`. It links to the existing Docusaurus library at `/manuals/`; the Japanese home page at `/ja/` links to `/manuals/ja/`.

Four resource cards are configured: Manuals, Training Guide, Company Map, and Company Official Documents. Manuals is active. The remaining cards are clearly marked as coming soon with disabled buttons until you add their content or URLs.

## Build

Node.js 24 is required. There are no package dependencies and no install step.

```sh
npm run build
npm run check
```

`dist/` contains the complete static home site, including English and Japanese pages and assets. Edit `portal.config.json` to change the cards. To activate a planned card, set `status` to `available` and add localized `href` and `button` fields, following the Manuals entry. Both a path on this domain (such as `/training/`) and an HTTPS link are supported. Add the destination content before enabling its card.

## Deploy at the root GitHub Pages address

GitHub assigns `/manuals/` to the existing `manuals` repository. Publishing a home page from that repository cannot place it at the domain root.

1. Create or use `kyouritsu-sysadmin/kyouritsu-sysadmin.github.io`.
2. Copy the **contents of this `portal/` directory** into that repository's root, including `.github/`, `scripts/`, `src/`, `package.json`, `portal.config.json`, and `.gitignore`. Do not copy `.preview/` or `dist/`.
3. Commit and push to its default branch.
4. Select **Settings → Pages → Source → GitHub Actions**.
5. Run **Build and publish company home** from **Actions**, using the default branch.

The supplied workflow is designed for the root repository and deliberately will not deploy from a project repository. It builds and validates the home site without installing dependencies. Keep deploying the manuals from the existing `manuals` repository using its existing workflow. The two sites share the domain and link to each other, while retaining their own deployment history.

No changes to the existing manuals document URLs or Japanese URLs are needed. The document breadcrumb Home icon and the KYORITSU header in the manuals navigate to `https://kyouritsu-sysadmin.github.io/` in the same tab. There is no separate Home button in the manuals navigation.

## Combined local preview (from the manuals source repository)

From the sibling `my-docs/` directory:

```sh
npm run build:preview
python3 -m http.server 3000 --directory ../portal/.preview --bind 127.0.0.1
```

Open `http://127.0.0.1:3000/`, choose Manuals, and select the KYORITSU header to return home. This assembles both sites for preview only; it does not change either production artifact or publish anything. `PREVIEW_HOME_URL` changes the preview host if needed.

Reference: [GitHub user/organization sites and project sites](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

## Shared visual theme

`src/theme.css` contains the approved blue palette and typography tokens. `src/styles.css` styles the home page. Mona Sans, Hubot Sans, and Noto Sans JP are bundled in `src/fonts/` with their licenses; the build copies all assets into `dist/assets/`. Keep the complete `src/` directory when syncing this portal into the root homepage repository. In the manuals source repository, its generator also consumes this theme and these fonts.
