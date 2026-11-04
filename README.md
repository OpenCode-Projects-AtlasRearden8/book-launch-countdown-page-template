# book-launch-countdown-page-template

A single-page, static countdown site for a **book launch day** — built for Dylan Asdale's *The Massive AI Manual*. Pure HTML/CSS/JS: no build step, no dependencies, no API keys. Drop it on GitHub Pages (or open it straight from disk with `file://`) and it works.

**One config file to fill. Nothing else to edit.**

## What's on the page

| Section | What it does | Where you configure it |
| --- | --- | --- |
| Big countdown timer | Counts down days / hours / minutes / seconds to launch, ticks live | `launchDate`, `teaser`, `liveMessage` |
| Pre-order / store links | Card grid of stores (Amazon, paperback, bundle, etc.) | `links` — delete a card by deleting its entry |
| Sample-chapter block | Free excerpt quote + PDF download + read-in-browser buttons | `sample` — set to `""` to hide the block |
| Newsletter sign-up | Embeds your provider's form (Mailchimp / Buttondown / ConvertKit…) inside a sandboxed iframe | `newsletterEmbed` — `""` shows a labeled placeholder |
| Media & press kit | Cover packs, author photos, press release, bio, contact email | `mediaKit` |
| Footer | Book blurb + credit + copyright line | `footerText`, `copyright` |

## Quickstart

1. Open **`config.js`** — it is the only file you need to touch.
2. Set `launchDate` to your launch moment (your local time), e.g. `"2027-03-15T09:00:00"`.
3. Fill (or blank out) the store links, sample PDF path, newsletter embed, and media-kit URLs.
4. Open `index.html` in a browser. Done.

### On GitHub Pages

Push the folder to a repo, enable Pages (Settings → Pages → deploy from branch). The page needs no server features, so it works default-configured.

## Testing

Requires Node.js (any recent version). No packages to install.

```bash
npm test                            # or: node tests/run-tests.js
```

The suite covers:

- **Countdown math** — date parsing (local, date-only, UTC, offsets), rollover rejection (no fake Feb 30 → March 2), days/hours/minutes breakdown, past-launch state
- **Config parsing** — validation of `launchDate`, store links (including refusal of `javascript:` URLs), sample block, newsletter embed type, media kit, tick-rate bounds
- **Shipped config itself** — loads under a browser-shaped sandbox and must validate clean

## Filling in real files

The template ships with *paths configured but files absent*, so downloads 404 until you add your own:

```
assets/
  The-Massive-AI-Manual-sample.pdf   ← sample chapter (config: sample.downloadFile)
  press/
    cover-pack.zip                   ← config: mediaKit.coverImages
    author-photos.zip                ← config: mediaKit.authorPhoto
    press-release.pdf                ← config: mediaKit.pressRelease
    author-bio.docx                  ← config: mediaKit.authorBio
```

Add what you need; remove or blank `mediaKit` entries you don't (the missing file is rendered as "coming soon" instead of a broken link).

## How this differs from `author-site-starter-template`

`author-site-starter-template` is the **whole author site** — bio, books index, projects, contact. This page is the **launch-day spike**: one book, one date, with the countdown front and center. Use the author site as your permanent home; point a short link at this page during launch week. Delete it (or flip `liveMessage` in) when the sprint is over.

## Design notes

- Mobile-first: the timer reflows to four compact boxes on small screens; media-kit rows stack vertically under 640px.
- No tracking, no cookies, no external assets. The newsletter embed runs inside a sandboxed `<iframe>` (`allow-forms allow-popups allow-same-origin allow-scripts`) so a third-party snippet can't touch the rest of the page.
- If `config.js` has a problem, the page renders anyway and shows a small red warning listing the first error (full list in the browser console).
- No secrets or personal data anywhere in the template — the media contact is `media@dylanasdale.example`, a reserved example domain you're expected to replace.

---

Made by **Asdale Dynamics, LLC** as part of Dylan Asdale's beginner-friendly AI series ("explained like a friend would: plain English, step by step, never condescending"). Hub site: [dylanasdale.github.io](https://dylanasdale.github.io/). Code licensed **MIT** — see [LICENSE](LICENSE) (`Copyright (c) 2026 Asdale Dynamics, LLC`).
