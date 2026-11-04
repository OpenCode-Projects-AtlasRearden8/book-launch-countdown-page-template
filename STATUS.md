# STATUS.md — book-launch-countdown-page-template

Last verified: 2026-11-04

## What was built

A static single-page launch-day site for *The Massive AI Manual* (Dylan Asdale / Asdale Dynamics, LLC). Pure HTML/CSS/JS, zero dependencies, zero build step — runs from `file://` or GitHub Pages as-is.

- **`index.html`** — the page: hero, big countdown timer, pre-order/store card grid, sample-chapter block (download + read-online + excerpt), newsletter embed slot, media-kit list, footer. All styling is inline in a `<style>` block so the drop-in stays small; mobile-first rules at a 640px breakpoint.
- **`config.js`** — the single file a template user fills. Set `launchDate`, store `links`, `sample`, `newsletterEmbed`, `mediaKit`, `footerText`/`copyright`, and countdown tick flags.
- **`countdown.js`** — dependency-free countdown library: ISO-8601 parsing (local/date-only/UTC/offset), rollover rejection (`2026-02-30` and non-leap Feb 29 return null), `getRemaining`, `pad2`, `formatDate`, and a `setInterval` painter that stops cleanly.
- **`app.js`** — page glue: reads `window.APP_CONFIG.landing`, `validateConfig` (pure, Node-testable), renders store cards / sample / media kit, injects the newsletter embed inside a sandboxed `<iframe>`, shows a configurable red warning banner when config is broken, flips to `liveMessage` after launch passes.
- **`tests/run-tests.js`** — Node built-in test runner (`node:test`), no packages to install.
- **`README.md`**, **`LICENSE`** (MIT, `Copyright (c) 2026 Asdale Dynamics, LLC`), **`package.json`** (`npm test`), **`assets/README.md`** (where the real PDFs/zips go).

## How to run

- Open `index.html` in any browser. No server needed.
- Deploy: push to a repo, enable GitHub Pages from branch. Done.
- To customize, edit **`config.js` only**.

## Verification results

- `node tests/run-tests.js` → **24/24 pass** (parsing, rollover rejection, countdown math, padding/formatting, config validation incl. `javascript:` URL refusal, and the shipped `config.js` validated under a `vm` browser-sandbox).
- Browser-shaped smoke test (jsdom, kept outside the repo at /tmp during development): loads `index.html` with the real `config.js`/`countdown.js`/`app.js` exactly like a browser → **21/21 checks pass**: live timer digits render padded, launch-date line reads "Launch day · December 1, 2026 at 9 AM", all config text flows into hero/footer/title, 3 store cards, sample links wired, newsletter placeholder + sandboxed iframe variants both behave, media kit renders 4 rows + press contact, past-launch date shows the live message, broken config shows the warning banner.
- Both suites were run after every fix; final run of each was fully green.

## Known gaps / intentional limits

1. **Sample PDF and media-kit files are not included** — real documents belong to the author. The paths exist in `config.js`; until you add files, downloads 404 (media kit shows "coming soon" instead of a broken link).
2. **Store links are `#` placeholders** — fill in real Amazon/paperback/etc. URLs in `config.js`.
3. **Newsletter embed ships empty** (`newsletterEmbed: ""`) by design: no third-party snippet is bundled from a template context; the sandboxed iframe only appears once you paste your own provider's embed.
4. **CSS is inline** in `index.html`'s `<style>` block so the drop-in stays small (index.html + config.js + countdown.js + app.js). Mobile-first rules at a 640px breakpoint. Split into `styles.css` if you grow the page; nothing depends on it being inline.
5. Timezone handling: without a `Z`/offset, config dates are interpreted in each visitor's local time — usually what you want for a "launch day" but worth knowing.
6. jsdom smoke test is not part of the repo (dev-tool on the maintainer's machine); the shipped suite is pure `node:test` so `npm test` works offline anywhere.
