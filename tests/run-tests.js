/*
 * Test suite for the book-launch countdown page.
 *
 *   node tests/run-tests.js        (or: npm test)
 *
 * Covers:
 *   1. countdown date parsing (local, date-only, UTC, offsets, junk)
 *   2. countdown math (getRemaining: future/past/padding)
 *   3. display helpers (pad2, formatDate)
 *   4. config parsing / validation (used by app.js)
 *   5. the shipped config.js itself parses and is valid
 */
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");
const fs = require("fs");
const vm = require("vm");

const rootDir = path.join(__dirname, "..");

// countdown.js defines both globalThis.CountdownLib and module.exports
const CountdownLib = require(path.join(rootDir, "countdown.js"));
const App = require(path.join(rootDir, "app.js"));
assert.equal(globalThis.CountdownLib, CountdownLib, "countdown.js should expose a shared lib");

/* ---------------------------------------------------------------- *
 * 1. Date parsing
 * ---------------------------------------------------------------- */
test("parseDate: accepts plain dates", () => {
  const d = CountdownLib.parseDate("2026-12-01");
  assert.ok(d instanceof Date);
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 11);
  assert.equal(d.getDate(), 1);
});

test("parseDate: accepts date + time (local)", () => {
  const d = CountdownLib.parseDate("2026-12-01T09:30:00");
  assert.ok(d instanceof Date);
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getDate(), 1);
  assert.equal(d.getHours(), 9);
  assert.equal(d.getMinutes(), 30);
});

test("parseDate: accepts UTC and offset forms", () => {
  assert.ok(CountdownLib.parseDate("2026-12-01T09:00:00Z") instanceof Date);
  assert.ok(CountdownLib.parseDate("2026-12-01T09:00:00-05:00") instanceof Date);
  assert.ok(CountdownLib.parseDate("2026-12-01T09:00:00+0530") instanceof Date);
});

test("parseDate: rejects junk of every known species", () => {
  for (const junk of [
    "", "   ", "launch day", "Dec 1, 2026", "2026/12/01", "null",
    "undefined", "{}", "not-a-date", "2026-02-30T00:00:00Z" /* nonexistent day */,
    "12-01-2026"
  ]) {
    assert.equal(CountdownLib.parseDate(junk), null, `expected null for ${JSON.stringify(junk)}`);
  }
  assert.equal(CountdownLib.parseDate(null), null);
  assert.equal(CountdownLib.parseDate(undefined), null);
});

test("parseDate: nonexistent Feb 29 on a non-leap year is rejected", () => {
  // 2026 is not a leap year - Feb 29 must not roll over to March 1.
  assert.equal(CountdownLib.parseDate("2026-02-29"), null);
  assert.equal(CountdownLib.parseDate("2026-02-29T10:00:00Z"), null);
});

/* ---------------------------------------------------------------- *
 * 2. Countdown math
 * ---------------------------------------------------------------- */
test("getRemaining: 90 seconds out", () => {
  const now = new Date(2026, 0, 1, 12, 0, 0);
  const target = new Date(now.getTime() + 90 * 1000);
  const r = CountdownLib.getRemaining(target, now);
  assert.equal(r.past, false);
  assert.equal(r.days, 0);
  assert.equal(r.hours, 0);
  assert.equal(r.minutes, 1);
  assert.equal(r.seconds, 30);
  assert.equal(r.totalSeconds, 90);
});

test("getRemaining: 25 hours out rolls into days", () => {
  const now = new Date(2026, 0, 1, 12, 0, 0);
  const target = new Date(now.getTime() + 25 * 3600 * 1000);
  const r = CountdownLib.getRemaining(target, now);
  assert.equal(r.days, 1);
  assert.equal(r.hours, 1);
  assert.equal(r.minutes, 0);
  assert.equal(r.seconds, 0);
});

test("getRemaining: past launch is marked and still counts upward", () => {
  const now = new Date(2026, 0, 1, 12, 0, 0);
  const target = new Date(now.getTime() - 3 * 86400000 - 45 * 60000);
  const r = CountdownLib.getRemaining(target, now);
  assert.equal(r.past, true);
  assert.equal(r.days, 3);
  assert.equal(r.minutes, 45);
  assert.ok(r.totalSeconds < 0, "totalSeconds should be negative once past");
});

test("getRemaining: bad input returns null", () => {
  assert.equal(CountdownLib.getRemaining(new Date(), "nope"), null);
  assert.equal(CountdownLib.getRemaining(null, new Date()), null);
});

/* ---------------------------------------------------------------- *
 * 3. Display helpers
 * ---------------------------------------------------------------- */
test("pad2 pads single digits and leaves doubles alone", () => {
  assert.equal(CountdownLib.pad2(7), "07");
  assert.equal(CountdownLib.pad2(0), "00");
  assert.equal(CountdownLib.pad2(45), "45");
  assert.equal(CountdownLib.pad2(-7), "07");
  assert.equal(CountdownLib.pad2("7"), "07");
});

test("formatDate renders a friendly local string", () => {
  assert.equal(
    CountdownLib.formatDate(new Date(2026, 11, 1, 9, 0, 0)),
    "December 1, 2026 at 9 AM"
  );
  assert.equal(
    CountdownLib.formatDate(new Date(2026, 11, 1, 15, 5, 0)),
    "December 1, 2026 at 3:05 PM"
  );
  assert.equal(CountdownLib.formatDate(null), "");
  assert.equal(CountdownLib.formatDate(new Date("garbage")), "");
});

/* ---------------------------------------------------------------- *
 * 4. Config validation
 * ---------------------------------------------------------------- */
function goodConfig() {
  return {
    bookTitle: "The Massive AI Manual",
    launchDate: "2026-12-01T09:00:00",
    links: [{ label: "Amazon Kindle", url: "#kindle" }],
    sample: { downloadFile: "assets/sample.pdf", excerpt: "quoted words" },
    newsletterEmbed: "",
    mediaKit: { pressRelease: { name: "Press release", url: "assets/press.pdf" }, contactEmail: "media@dylanasdale.example" },
    countdown: { showDays: true, tickMs: 1000 },
  };
}

test("validateConfig: shipped-style config passes", () => {
  const res = App.validateConfig(goodConfig());
  assert.equal(res.ok, true, res.errors.join("; "));
  assert.ok(res.values.launchDate instanceof Date);
});

test("validateConfig: empty object has exactly the launchDate complaint", () => {
  const res = App.validateConfig({});
  assert.equal(res.ok, false);
  assert.equal(res.errors.length, 1);
  assert.match(res.errors[0], /launchDate/);
});

test("validateConfig: null or missing config is rejected", () => {
  for (const bad of [null, undefined, "hello", 42]) {
    const res = App.validateConfig(bad);
    assert.equal(res.ok, false, `expected failure for ${String(bad)}`);
  }
});

test("validateConfig: junk launch dates fail with a hint", () => {
  const res = App.validateConfig(Object.assign(goodConfig(), { launchDate: "whenever" }));
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => /launchDate/.test(e)));
});

test("validateConfig: script URLs in links are refused", () => {
  const res = App.validateConfig(
    Object.assign(goodConfig(), { links: [{ label: "Bad", url: "javascript:alert(1)" }] })
  );
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => /links\[0\]/.test(e)));
});

test("validateConfig: relative asset paths are fine", () => {
  const res = App.validateConfig(goodConfig());
  assert.equal(res.ok, true, res.errors.join("; "));
});

test("validateConfig: links must be an array of {label, url}", () => {
  let res = App.validateConfig(Object.assign(goodConfig(), { links: "amazon.com/mybook" }));
  assert.equal(res.ok, false);
  res = App.validateConfig(Object.assign(goodConfig(), { links: [{ label: "x" }] }));
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => /links\[0\]\.url/.test(e)));
});

test("validateConfig: sample=true hides the block; junk sample fails", () => {
  let res = App.validateConfig(Object.assign(goodConfig(), { sample: "" }));
  assert.equal(res.ok, true, res.errors.join("; "));

  res = App.validateConfig(Object.assign(goodConfig(), { sample: "yes" }));
  assert.equal(res.ok, false);
});

test("validateConfig: newsletterEmbed must be a string or empty", () => {
  assert.equal(App.validateConfig(Object.assign(goodConfig(), { newsletterEmbed: "" })).ok, true);
  assert.equal(App.validateConfig(Object.assign(goodConfig(), { newsletterEmbed: "<form></form>" })).ok, true);
  assert.equal(App.validateConfig(Object.assign(goodConfig(), { newsletterEmbed: 42 })).ok, false);
});

test("validateConfig: countdown flags and tickMs are checked", () => {
  assert.equal(App.validateConfig(Object.assign(goodConfig(), { countdown: { tickMs: 10 } })).ok, false);
  assert.equal(App.validateConfig(Object.assign(goodConfig(), { countdown: { showDays: "yes" } })).ok, false);
  assert.equal(App.validateConfig(Object.assign(goodConfig(), { countdown: { tickMs: 2000 } })).ok, true);
});

test("validateConfig: contactEmail is checked but may be blanked", () => {
  assert.equal(App.validateConfig(Object.assign(goodConfig(), { mediaKit: { contactEmail: "nope" } })).ok, false);
  assert.equal(App.validateConfig(Object.assign(goodConfig(), { mediaKit: { contactEmail: "" } })).ok, true);
});

test("validateConfig: blank optional strings are refused", () => {
  const res = App.validateConfig(Object.assign(goodConfig(), { bookTitle: "   " }));
  assert.equal(res.ok, false);
  assert.ok(res.errors.some((e) => /bookTitle/.test(e)));
});

/* ---------------------------------------------------------------- *
 * 5. The shipped config.js parses under a browser-shaped sandbox
 * ---------------------------------------------------------------- */
test("shipped config.js loads in a window sandbox and validates clean", () => {
  const file = path.join(rootDir, "config.js");
  const source = fs.readFileSync(file, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(source, sandbox, { filename: "config.js" });

  const landing = sandbox.window.APP_CONFIG.landing;
  assert.ok(landing && typeof landing === "object", "window.APP_CONFIG.landing missing");
  const res = App.validateConfig(landing);
  assert.equal(res.ok, true, "shipped config.js has problems: " + res.errors.join("; "));

  // Sane defaults everyone can read:
  assert.equal(landing.author, "Dylan Asdale");
  assert.ok(/Asdale Dynamics, LLC/.test(landing.copyright));
  assert.ok(landing.links.length >= 1);
  assert.ok(CountdownLib.parseDate(landing.launchDate) instanceof Date);
});
