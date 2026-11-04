/*
 * countdown.js - self-contained countdown helpers for the book launch page.
 *
 * Runs from file:// or any static host (GitHub Pages, Netlify, ...).
 * No dependencies, no build step. Exposes a small pure API that the
 * page script (app.js) drives with setInterval.
 */
(function (global) {
  "use strict";

  /** Parse a local-time ISO-8601 date like "2026-12-01" or "2026-12-01T09:00". */
  function parseDate(value) {
    return parseDateInput(String(value == null ? "" : value));
  }

  function parseDateInput(value) {
    if (typeof value !== "string") return null;
    var s = value.trim();
    // Accepts: "2026-12-01", "2026-12-01T09:00", "2026-12-01T09:00:00",
    // plus UTC ("...Z") or numeric-offset ("+05:30", "-0530") variants.
    // Date-only and tz-less values are interpreted in the visitor's local time.
    var m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?)?(Z|[+-]\d{2}:?\d{2})?$/.exec(s);
    if (!m) return null;

    var y = +m[1], mo = +m[2], da = +m[3];
    var h = m[4] ? +m[4] : 0;
    var mi = m[5] ? +m[5] : 0;
    var sec = m[6] ? +m[6] : 0;
    var tz = m[7];

    // Sanity check in UTC space first - this rejects rollovers such as
    // 2026-02-30 (would otherwise silently become March 2).
    var utc = new Date(Date.UTC(y, mo - 1, da, h, mi, sec));
    if (
      utc.getUTCFullYear() !== y || utc.getUTCMonth() !== mo - 1 ||
      utc.getUTCDate() !== da || utc.getUTCHours() !== h ||
      utc.getUTCMinutes() !== mi || utc.getUTCSeconds() !== sec
    ) {
      return null;
    }

    var d;
    if (!tz) {
      d = new Date(y, mo - 1, da, h, mi, sec); // local wall-clock time
    } else if (tz === "Z") {
      d = utc;
    } else {
      var sign = tz.charAt(0) === "-" ? -1 : 1;
      var digits = tz.slice(1).replace(":", "");
      var offMinutes = (+digits.slice(0, 2)) * 60 + (+digits.slice(2));
      d = new Date(utc.getTime() - sign * offMinutes * 60000);
    }
    return isNaN(d.getTime()) ? null : d;
  }

  /** Whole days/hours/minutes/seconds remaining from `now` to `target`. */
  function getRemaining(target, now) {
    if (!(target instanceof Date) || !(now instanceof Date)) return null;
    var msTarget = target.getTime();
    var msNow = now.getTime();
    var diff = msTarget - msNow;

    var past = diff < 0;
    var abs = Math.abs(diff);

    var days = Math.floor(abs / 86400000);
    var hours = Math.floor(abs / 3600000) % 24;
    var minutes = Math.floor(abs / 60000) % 60;
    var seconds = Math.floor(abs / 1000) % 60;

    return {
      past: past,
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
      totalSeconds: Math.floor(abs / 1000) * (past ? -1 : 1),
      diffMs: diff
    };
  }

  /** Pad to 2 digits ("7" -> "07"). */
  function pad2(n) {
    n = Math.abs(Math.floor(Number(n) || 0));
    return (n < 10 ? "0" : "") + n;
  }

  /** Friendly sentence, e.g. "December 1, 2026 at 9:00 AM". */
  function formatDate(d) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "";
    var months = [
      "January", "February", "March", "April", "May", "June", "July",
      "August", "September", "October", "November", "December"
    ];
    var h = d.getHours();
    var h12 = h % 12 === 0 ? 12 : h % 12;
    var ampm = h < 12 ? "AM" : "PM";
    var min = d.getMinutes();
    var minPart = min === 0 ? "" : ":" + (min < 10 ? "0" + min : min);
    return (
      months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear() +
      " at " + h12 + minPart + " " + ampm
    );
  }

  /** Default DOM painter used by app.js. Returns a stop() function. */
  function attach(el, config, onTick) {
    if (!el) return function () {};
    var ids = ["days", "hours", "mins", "secs"];
    var els = {
      days: el.querySelector("#cd-days"),
      hours: el.querySelector("#cd-hours"),
      mins: el.querySelector("#cd-mins"),
      secs: el.querySelector("#cd-secs")
    };
    var live = el.querySelector("#cd-live");
    var target = parseDate(config.launchDate);
    var tickMs = Math.max(250, (config.countdown && config.countdown.tickMs) || 1000);

    function render(now) {
      var r = getRemaining(target, now);
      if (!r) return;
      els.days.textContent = String(r.days);
      els.hours.textContent = pad2(r.hours);
      els.mins.textContent = pad2(r.minutes);
      els.secs.textContent = pad2(r.seconds);
      if (live) live.textContent = r.past ? "launch passed" : "counting down";
      if (typeof onTick === "function") onTick(r);
    }

    render(new Date());
    var t = setInterval(function () { render(new Date()); }, tickMs);
    return function stop() { clearInterval(t); };
  }

  var api = {
    parseDate: parseDate,
    getRemaining: getRemaining,
    pad2: pad2,
    formatDate: formatDate,
    attach: attach
  };

  global.CountdownLib = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
