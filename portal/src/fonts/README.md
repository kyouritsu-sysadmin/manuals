# Self-hosted typography

Unmodified WOFF2 binaries from these pinned Fontsource packages:

- `@fontsource-variable/mona-sans@5.3.0` — https://github.com/github/mona-sans
- `@fontsource-variable/hubot-sans@5.3.0` — https://github.com/github/hubot-sans
- `@fontsource-variable/noto-sans-jp@5.3.1` — https://github.com/google/fonts/tree/main/ofl/notosansjp

Each font's SIL Open Font License is included alongside the assets. CSS family aliases omit “Variable”; font binaries have not been modified. `fonts.css` retains the package Unicode ranges and `font-display: swap` so browsers load only needed subsets, including romaji macrons and Japanese glyphs. No runtime request goes to a font CDN.

`portal/src/theme.css` defines the shared colors and font stacks. The manuals generator copies this theme and font directory into its static assets. The portal build copies them into `dist/assets/`. Keep this directory intact when copying the portal to the root homepage repository.
