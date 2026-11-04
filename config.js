/*
 * The Massive AI Manual - launch page config
 * ------------------------------------------
 * This is the ONLY file you need to edit.
 * Change anything below and reload the page in a browser.
 */

window.APP_CONFIG = window.APP_CONFIG || {};
window.APP_CONFIG.landing = {

  // ----- Book identity -----
  bookTitle: "The Massive AI Manual",
  subtitle: "Learn AI like a friend would explain it.",
  author: "Dylan Asdale",
  publisher: "Asdale Dynamics, LLC",
  siteUrl: "https://dylanasdale.github.io/",

  // ----- Countdown -----
  // Launch date and time in YOUR local timezone (ISO 8601, seconds optional).
  launchDate: "2026-12-01T09:00:00",
  // Text shown above the timer while waiting.
  teaser: "Launch day ·",
  // Text swapped in once the timer hits zero.
  liveMessage: "It's live! The Massive AI Manual is out now.",

  // ----- Pre-order / store links -----
  // Empty out any store you don't use; the card disappears.
  links: [
    {
      label: "Amazon Kindle",
      note: "Pre-order the ebook",
      url: "#amazon-preorder"
    },
    {
      label: "Paperback",
      note: "Order the print edition",
      url: "#paperback"
    },
    {
      label: "Authors Hub",
      note: "Bundle: book + starter templates",
      url: "#authors-hub"
    }
  ],

  // ----- Sample chapter -----
  // Set to "" to hide the whole block.
  sample: {
    headline: "Read a free chapter",
    blurb: "Not sure it's for you? Try the sample chapter - no email needed.",
    excerpt:
      "\"You don't need to be 'a tech person.' You read it like I'd explain it over coffee - one small step at a time.\"",
    downloadFile: "assets/The-Massive-AI-Manual-sample.pdf",
    readBookTitle: "The Massive AI Manual"
  },

  // ----- Newsletter -----
  // Paste any embed snippet (Mailchimp, Buttondown, ConvertKit...).
  // Leave as "" to show the gray placeholder box.
  newsletterEmbed: "",
  newsletterBlurb:
    "One email on launch day. That's it. No spam, unsubscribe any time.",

  // ----- Media kit -----
  mediaKit: {
    coverImages: { name: "Cover images (JPG + PNG)", url: "assets/press/cover-pack.zip", size: "12 MB" },
    authorPhoto: { name: "Author photos", url: "assets/press/author-photos.zip", size: "4 MB" },
    pressRelease: { name: "Press release (PDF)", url: "assets/press/press-release.pdf", size: "200 KB" },
    authorBio: { name: "Author bio + FAQ", url: "assets/press/author-bio.docx", size: "40 KB" },
    contactEmail: "media@dylanasdale.example" // change to your real inbox
  },

  // ----- Footer -----
  footerText:
    "This is a launch-day page for The Massive AI Manual. The full author site lives at dylanasdale.github.io.",
  copyright: "Copyright (c) 2026 Asdale Dynamics, LLC",

  // ----- Countdown tuning -----
  countdown: { showDays: true, showHours: true, showMinutes: true, showSeconds: true, tickMs: 1000 }
};
