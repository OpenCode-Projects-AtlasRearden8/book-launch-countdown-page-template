/*
 * app.js - page glue for the book launch countdown template.
 *
 * Reads exactly ONE source of truth: window.APP_CONFIG.landing in config.js.
 * Pure functions (config validation) are exported for tests when a
 * CommonJS loader is present; DOM wiring only runs in the browser.
 */
(function (global) {
  "use strict";

  /* ------------------------------------------------------------------ *
   *  1. Config validation (pure - testable in Node without a browser)
   * ------------------------------------------------------------------ */

  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }

  function isUrlish(v) {
    if (!isNonEmptyString(v)) return false;
    var s = v.trim();
    if (/^(javascript|data|vbscript):/i.test(s)) return false; // block script URLs outright
    if (/^(https?:\/\/|\/|#)/i.test(s)) return true;           // absolute, root-relative, or in-page
    return !/^[a-z][a-z0-9+.-]*:/i.test(s);                    // plain relative path like "assets/x.pdf"
  }

  /**
   * Validate the `landing` config object.
   * Returns { ok: <bool>, errors: [...], values: { launchDate: Date|null } }.
   */
  function validateConfig(cfg) {
    var result = { ok: true, errors: [], values: { launchDate: null } };

    if (!cfg || typeof cfg !== "object") {
      result.ok = false;
      result.errors.push("config: expected an object (window.APP_CONFIG.landing missing?)");
      return result;
    }

    var CountdownLib = global.CountdownLib;

    // launchDate: required, must parse when present
    if (!isNonEmptyString(cfg.launchDate)) {
      result.ok = false;
      result.errors.push("launchDate: required, e.g. \"2026-12-01T09:00:00\" (your local time)");
    } else {
      var d = CountdownLib.parseDate(cfg.launchDate);
      if (!d) {
        result.ok = false;
        result.errors.push("launchDate: could not parse \"" + cfg.launchDate + "\" (use YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS)");
      } else {
        result.values.launchDate = d;
      }
    }

    // Optional text fields - "" is a deliberate blank for these
    var optionalText = { subtitle: true, teaser: true, liveMessage: true, footerText: true };
    var requiredText  = { bookTitle: true, author: true, publisher: true, copyright: true };
    Object.keys(requiredText).concat(Object.keys(optionalText)).forEach(function (key) {
      if (cfg[key] === undefined) return;
      var allowEmpty = !!optionalText[key];
      if (typeof cfg[key] !== "string" || (!allowEmpty && cfg[key].trim() === "")) {
        result.ok = false;
        result.errors.push(key + (allowEmpty
          ? ": must be a string (delete the line or write \"\" to blank it out)"
          : ": must be a non-empty string (or delete the line)"));
      }
    });

    // links
    if (cfg.links !== undefined) {
      if (!Array.isArray(cfg.links)) {
        result.ok = false;
        result.errors.push("links: must be an array of {label, url}");
      } else {
        cfg.links.forEach(function (link, i) {
          if (!link || typeof link !== "object") {
            result.ok = false;
            result.errors.push("links[" + i + "]: must be an object with {label, url}");
            return;
          }
          if (!isNonEmptyString(link.label)) {
            result.ok = false;
            result.errors.push("links[" + i + "].label: must be a non-empty string");
          }
          if (!isUrlish(link.url)) {
            result.ok = false;
            result.errors.push("links[" + i + "].url \"" + link.url + "\": use an https:// or / or # link");
          }
        });
      }
    }

    // sample block ("" hides the whole section)
    if (cfg.sample !== undefined && cfg.sample !== "") {
      if (!cfg.sample || typeof cfg.sample !== "object") {
        result.ok = false;
        result.errors.push("sample: must be an object (or set it to \"\" to hide the block)");
      } else {
        if (isNonEmptyString(cfg.sample.downloadFile) && !isUrlish(cfg.sample.downloadFile)) {
          result.ok = false;
          result.errors.push("sample.downloadFile \"" + cfg.sample.downloadFile + "\": use an https:// or / or # link");
        }
        if (cfg.sample.excerpt !== undefined && !isNonEmptyString(cfg.sample.excerpt)) {
          result.ok = false;
          result.errors.push("sample.excerpt: must be a non-empty string");
        }
      }
    }

    // media kit
    if (cfg.mediaKit !== undefined) {
      if (!cfg.mediaKit || typeof cfg.mediaKit !== "object") {
        result.ok = false;
        result.errors.push("mediaKit: must be an object");
      } else {
        ["coverImages", "authorPhoto", "pressRelease", "authorBio"].forEach(function (key) {
          var item = cfg.mediaKit[key];
          if (item !== undefined && item !== null && (typeof item !== "object" || !isNonEmptyString(item.name))) {
            result.ok = false;
            result.errors.push("mediaKit." + key + ": must be an object with at least a name");
          }
        });
        if (cfg.mediaKit.contactEmail !== undefined && cfg.mediaKit.contactEmail !== "" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.mediaKit.contactEmail)) {
          result.ok = false;
          result.errors.push("mediaKit.contactEmail: doesn't look like an email address");
        }
      }
    }

    // newsletter embed: must be a string when present ("" = placeholder)
    if (cfg.newsletterEmbed !== undefined && typeof cfg.newsletterEmbed !== "string") {
      result.ok = false;
      result.errors.push("newsletterEmbed: must be a string (paste the embed HTML, or \"\" for the placeholder)");
    }
    if (cfg.newsletterBlurb !== undefined && !(cfg.newsletterBlurb === "" || isNonEmptyString(cfg.newsletterBlurb))) {
      result.ok = false;
      result.errors.push("newsletterBlurb: must be a non-empty string (or \"\")");
    }

    // countdown tuning
    if (cfg.countdown !== undefined) {
      if (!cfg.countdown || typeof cfg.countdown !== "object") {
        result.ok = false;
        result.errors.push("countdown: must be an object of true/false flags + tickMs");
      } else {
        ["showDays", "showHours", "showMinutes", "showSeconds"].forEach(function (key) {
          if (cfg.countdown[key] !== undefined && typeof cfg.countdown[key] !== "boolean") {
            result.ok = false;
            result.errors.push("countdown." + key + ": must be true or false");
          }
        });
        if (cfg.countdown.tickMs !== undefined &&
            (typeof cfg.countdown.tickMs !== "number" || cfg.countdown.tickMs < 250 || cfg.countdown.tickMs > 60000)) {
          result.ok = false;
          result.errors.push("countdown.tickMs: must be a number between 250 and 60000");
        }
      }
    }

    return result;
  }

  /* ------------------------------------------------------------------ *
   *  2. Small safe-DOM helpers (no innerHTML for anything user-configured)
   * ------------------------------------------------------------------ */

  function setText(id, text) {
    var el = document.getElementById(id);
    if (el && typeof text === "string") el.textContent = text;
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  /* ------------------------------------------------------------------ *
   *  3. Section renderers
   * ------------------------------------------------------------------ */

  function renderStoreLinks(links) {
    var grid = document.getElementById("store-links");
    if (!grid) return;
    clearNode(grid);
    (links || []).forEach(function (link) {
      if (!link || !link.label) return;
      var card = document.createElement("a");
      card.className = "link-card";
      card.href = link.url || "#";
      card.rel = "noopener";
      var badge = document.createElement("span");
      badge.className = "store-badge";
      badge.textContent = "Pre-Order";
      var name = document.createElement("span");
      name.className = "store-name";
      name.textContent = link.label;
      card.appendChild(badge);
      card.appendChild(name);
      if (link.note) {
        var note = document.createElement("span");
        note.className = "store-note";
        note.textContent = link.note;
        card.appendChild(note);
      }
      grid.appendChild(card);
    });
  }

  function renderSample(sample) {
    var section = document.querySelector("section#sample-section");
    if (!section) {
      // fall back: find by heading text
      var h2s = Array.prototype.slice.call(document.querySelectorAll("section h2"));
      for (var i = 0; i < h2s.length; i++) {
        if (h2s[i].id === "sample-title") { section = h2s[i].closest("section"); break; }
      }
    }
    if (!section) return;
    if (sample === "" || sample == null || !sample.downloadFile) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    var dl = document.getElementById("btn-download");
    var online = document.getElementById("btn-read-online");
    if (dl) dl.href = sample.downloadFile;
    if (online && sample.readBookTitle) {
      online.href = sample.downloadFile;
      online.setAttribute("target", "_blank");
      online.setAttribute("rel", "noopener");
    }
    var quote = document.getElementById("excerpt-quote");
    if (quote && sample.excerpt) quote.textContent = sample.excerpt;
    var source = document.getElementById("excerpt-source");
    if (source && sample.source) source.textContent = sample.source;
  }

  function renderNewsletter(embed) {
    var box = document.getElementById("newsletter-embed");
    if (!box) return;
    box.setAttribute("aria-busy", "false");
    clearNode(box);
    if (typeof embed !== "string" || embed.trim() === "") {
      var hint = document.createElement("p");
      hint.className = "embed-hint";
      hint.textContent = "Newsletter form placeholder - paste your provider's embed snippet into newsletterEmbed in config.js and it appears here.";
      box.appendChild(hint);
      return;
    }
    // Config is authored by the site owner themselves, so one
    // opt-in injection point is acceptable - guarded by a sandboxing iframe.
    var frame = document.createElement("iframe");
    frame.setAttribute("sandbox", "allow-forms allow-popups allow-same-origin allow-scripts");
    frame.setAttribute("title", "Newsletter sign-up");
    frame.setAttribute("loading", "lazy");
    frame.style.width = "100%";
    frame.style.minHeight = "340px";
    frame.style.border = "0";
    var doc = "<!DOCTYPE html><html><head><meta charset=\"utf-8\">" +
      "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">" +
      "<style>body{font-family:system-ui,sans-serif;margin:0;padding:4px}</style></head><body>" +
      embed +
      "</body></html>";
    frame.srcdoc = doc;
    box.appendChild(frame);
    box.style.overflowX = "auto";
  }

  function renderMediaKit(kit) {
    var list = document.getElementById("media-list");
    if (!list) return;
    clearNode(list);
    if (!kit || typeof kit !== "object") return;

    ["coverImages", "authorPhoto", "pressRelease", "authorBio"].forEach(function (key) {
      var item = kit[key];
      if (!item || !item.name) return;
      var li = document.createElement("li");
      var left = document.createElement("div");
      var nameEl = document.createElement("span");
      nameEl.className = "media-name";
      nameEl.textContent = item.name;
      left.appendChild(nameEl);
      if (item.size) {
        var size = document.createElement("div");
        size.className = "media-meta";
        size.textContent = "approx. " + item.size;
        left.appendChild(size);
      }
      var right = document.createElement("div");
      if (item.url && isUrlish(item.url)) {
        var a = document.createElement("a");
        a.className = "btn btn-secondary";
        a.href = item.url;
        a.textContent = "Download";
        a.setAttribute("download", "");
        right.appendChild(a);
      } else {
        var soon = document.createElement("span");
        soon.className = "media-meta";
        soon.textContent = "coming soon";
        right.appendChild(soon);
      }
      li.appendChild(left);
      li.appendChild(right);
      list.appendChild(li);
    });

    if (kit.contactEmail) {
      var li = document.createElement("li");
      var left = document.createElement("div");
      left.className = "media-name";
      left.textContent = "Press contact";
      var right = document.createElement("div");
      var a = document.createElement("a");
      a.href = "mailto:" + kit.contactEmail;
      a.textContent = kit.contactEmail;
      right.appendChild(a);
      li.appendChild(left);
      li.appendChild(right);
      list.appendChild(li);
    }
  }

  /* ------------------------------------------------------------------ *
   *  4. Boot
   * ------------------------------------------------------------------ */

  function boot() {
    var cfg = global.APP_CONFIG && global.APP_CONFIG.landing;
    var result = validateConfig(cfg);

    if (!result.ok) {
      console.error("[book-launch] config problems:\n- " + result.errors.join("\n- "));
      var warn = document.getElementById("config-warning");
      if (!warn) {
        warn = document.createElement("aside");
        warn.id = "config-warning";
        warn.style.cssText = "margin:12px auto;max-width:920px;padding:10px 16px;border-radius:12px;" +
          "background:#3b1d1d;color:#ffd9d9;border:1px solid #7c2b2b;font-size:0.88rem";
        warn.setAttribute("role", "alert");
        var header = document.querySelector("header.site-header");
        if (header && header.parentNode) header.parentNode.insertBefore(warn, header.nextSibling);
      }
      clearNode(warn);
      warn.textContent = "Config warning: " + result.errors[0] +
        (result.errors.length > 1 ? " (+" + (result.errors.length - 1) + " more - see browser console)" : "");
    }

    cfg = cfg || {};

    // Head + hero text from config
    if (cfg.bookTitle) {
      document.title = "Launching Soon: " + cfg.bookTitle;
      var titleSpan = document.querySelector(".book-title");
      if (titleSpan) titleSpan.textContent = cfg.bookTitle;
    }
    if (cfg.subtitle) setText("hook-line", cfg.subtitle);

    // Footer
    if (cfg.footerText) setText("footer-text", cfg.footerText);
    if (cfg.copyright) setText("copyright-line", cfg.copyright);

    // Sections
    renderStoreLinks(cfg.links);
    renderSample(cfg.sample === "" ? "" : cfg.sample);
    renderNewsletter(cfg.newsletterEmbed);
    renderMediaKit(cfg.mediaKit);

    // Countdown (CountdownLib is loaded before this file)
    if (global.CountdownLib) {
      var lib = global.CountdownLib;
      var liveLine = document.getElementById("launch-line");
      var liveShown = false;
      var target = lib.parseDate(cfg.launchDate);
      lib.attach(
        document.getElementById("countdown"),
        { launchDate: cfg.launchDate, countdown: cfg.countdown },
        function (r) {
          if (target && liveLine) {
            liveLine.textContent = cfg.teaser
              ? cfg.teaser + " " + lib.formatDate(target)
              : lib.formatDate(target);
          }
          if (r.past && cfg.liveMessage && !liveShown) {
            liveShown = true;
            var cd = document.getElementById("countdown");
            if (cd) {
              var p = document.createElement("p");
              p.className = "launch-line";
              p.textContent = cfg.liveMessage;
              p.setAttribute("role", "status");
              cd.parentNode.insertBefore(p, cd.nextSibling);
            }
            if (liveLine) liveLine.textContent = "";
          }
        }
      );
    }
  }

  var api = { validateConfig: validateConfig, isUrlish: isUrlish, boot: boot };
  global.LaunchPage = api;

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", boot);
    } else {
      boot();
    }
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})(typeof window !== "undefined" ? window : globalThis);
