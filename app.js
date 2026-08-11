(function () {
  /* ===== Live seating from a published Google Sheet (optional) =====
     Publish each tab: File > Share > Publish to web > (pick tab) > CSV,
     then paste the CSV links below. Leave "" to use the baked data.js only.
     The page ALWAYS falls back to data.js if a fetch is missing or fails. */
  var SHEETS = {
    guests:   "",   // Guests tab  -> published CSV url
    messages: "",   // Messages tab -> published CSV url
    facts:    ""    // facts live only in data.js (not sheet-driven)
  };
  var FETCH_TIMEOUT = 8000;   // ms before we give up and use the fallback

  function parseCSV(text) {
    text = String(text).replace(/^﻿/, "");
    var rows = [], row = [], field = "", inQ = false, i = 0;
    while (i < text.length) {
      var c = text[i];
      if (inQ) {
        if (c === '"') { if (text[i + 1] === '"') { field += '"'; i += 2; continue; } inQ = false; i++; continue; }
        field += c; i++; continue;
      }
      if (c === '"') { inQ = true; i++; continue; }
      if (c === ",") { row.push(field); field = ""; i++; continue; }
      if (c === "\r") { i++; continue; }
      if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; i++; continue; }
      field += c; i++;
    }
    row.push(field); rows.push(row);
    return rows.filter(function (r) { return r.some(function (x) { return x.trim() !== ""; }); });
  }
  function rowsToObjects(rows) {
    if (!rows.length) return [];
    var header = rows[0].map(function (h) { return h.trim().toLowerCase(); });
    return rows.slice(1).map(function (r) {
      var o = {}; header.forEach(function (h, idx) { o[h] = (r[idx] || "").trim(); }); return o;
    });
  }
  function buildSeatingFromRows(rows) {
    var tables = {};
    rows.forEach(function (g) {
      var tid = parseInt(g.table, 10);
      if (!tid) return;
      if (!tables[tid]) tables[tid] = { id: tid, top: [], bottom: [] };
      var side = (g.side || "").toLowerCase() === "bottom" ? "bottom" : "top";
      var seat = null;
      if (g.name) {
        seat = { name: g.name, party: g.party || "" };
        if (g.aliases) seat.aliases = g.aliases.split(";").map(function (s) { return s.trim(); }).filter(Boolean);
        if (g.quip) seat.quip = g.quip;
      }
      tables[tid][side].push(seat);
    });
    return Object.keys(tables).map(function (k) { return tables[k]; })
      .sort(function (a, b) { return a.id - b.id; })
      .map(function (t) { return { id: t.id, capacity: t.top.length + t.bottom.length, top: t.top, bottom: t.bottom }; });
  }
  function buildPartyNotesFromRows(rows) {
    var notes = {};
    rows.forEach(function (m) {
      if (!m.party || !m.message) return;
      if (!notes[m.party]) notes[m.party] = [];
      notes[m.party].push({ from: m.from || "", text: m.message });
    });
    return notes;
  }
  function fetchCSV(url) {
    if (!url) return Promise.resolve(null);
    var bust = (url.indexOf("?") > -1 ? "&" : "?") + "_=" + Date.now();
    var ctrl = (typeof AbortController !== "undefined") ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, FETCH_TIMEOUT) : null;
    return fetch(url + bust, { cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.text(); })
      .then(function (txt) { if (timer) clearTimeout(timer); return rowsToObjects(parseCSV(txt)); })
      .catch(function () { if (timer) clearTimeout(timer); return null; });
  }
  // Fetch the sheets and overwrite the globals; on any failure, keep data.js.
  function loadLiveData() {
    return Promise.all([fetchCSV(SHEETS.guests), fetchCSV(SHEETS.messages), fetchCSV(SHEETS.facts)])
      .then(function (res) {
        var g = res[0], m = res[1], f = res[2];
        if (g && g.length) window.SEATING_DATA = { tables: buildSeatingFromRows(g) };
        var content = window.WEDDING_CONTENT || {};
        if (m) content.partyNotes = buildPartyNotesFromRows(m);
        if (f && f.length) content.facts = f.map(function (r) { return r.facts || r.fact; }).filter(Boolean);
        window.WEDDING_CONTENT = content;
      })
      .catch(function () { /* keep the baked fallback */ });
  }

  /* ===== The app (reads whatever globals are set when it runs) ===== */
  function initApp() {
  var data = window.SEATING_DATA;

  // --- Build a flat, searchable index of all guests ---
  var guests = [];
  var tablesById = {};
  data.tables.forEach(function (t) {
    tablesById[t.id] = t;
    ["top", "bottom"].forEach(function (side) {
      (t[side] || []).forEach(function (seat, i) {
        if (seat && seat.name) {
          guests.push({
            name: seat.name,
            party: seat.party,
            aliases: seat.aliases || [],
            table: t.id,
            side: side,
            position: i
          });
        }
      });
    });
  });

  var input = document.getElementById("searchInput");
  var sugEl = document.getElementById("suggestions");
  var resultEl = document.getElementById("result");
  var wrapEl = document.querySelector(".wrap");
  var heroEl = document.querySelector("header.hero");
  var searchEl = document.querySelector(".search");
  var BASE_PAD = 28;

  // On the landing view, position the SEARCH BAR itself slightly above the
  // vertical middle (within thumb reach), rather than centering the whole
  // header+search block (which would push the search too low).
  function centerLanding() {
    if (wrapEl.classList.contains("has-result")) return;
    var aboveSearchCenter = heroEl.offsetHeight + 26 + (searchEl.offsetHeight / 2);
    var target = window.innerHeight * 0.45;   // 45% down = slightly above middle
    var pad = Math.max(BASE_PAD, target - aboveSearchCenter);
    wrapEl.style.paddingTop = pad + "px";
  }
  var activeIndex = -1;
  var currentMatches = [];

  function norm(s) { return (s || "").toLowerCase().trim(); }

  function search(q) {
    q = norm(q);
    if (!q) return [];
    var starts = [], contains = [];
    guests.forEach(function (g) {
      // match against the real name AND any nicknames/aliases
      var hay = [norm(g.name)].concat(g.aliases.map(norm));
      if (hay.some(function (h) { return h.indexOf(q) === 0; })) starts.push(g);
      else if (hay.some(function (h) { return h.indexOf(q) > -1; })) contains.push(g);
    });
    // matches that start with the query first, then the rest
    return starts.concat(contains).slice(0, 8);
  }

  function renderSuggestions() {
    var q = input.value;
    currentMatches = search(q);
    activeIndex = -1;

    if (!norm(q)) { hideSuggestions(); return; }

    sugEl.innerHTML = "";
    if (currentMatches.length === 0) {
      var li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Can't find your name? Check the spelling, or please ask one of our ushers.";
      sugEl.appendChild(li);
    } else {
      currentMatches.forEach(function (g, idx) {
        var li = document.createElement("li");
        li.dataset.idx = idx;
        var name = document.createElement("span");
        name.textContent = g.name;
        var tbl = document.createElement("span");
        tbl.className = "tbl";
        tbl.textContent = "Table " + g.table;
        li.appendChild(name);
        li.appendChild(tbl);
        li.addEventListener("mousedown", function (e) {
          e.preventDefault();
          choose(g);
        });
        sugEl.appendChild(li);
      });
    }
    sugEl.classList.add("open");
  }

  function hideSuggestions() {
    sugEl.classList.remove("open");   // fades out; content stays until next search
    activeIndex = -1;
  }

  function moveActive(dir) {
    var items = sugEl.querySelectorAll("li[data-idx]");
    if (!items.length) return;
    activeIndex = (activeIndex + dir + items.length) % items.length;
    items.forEach(function (el, i) {
      el.classList.toggle("active", i === activeIndex);
    });
  }

  function choose(g) {
    input.value = g.name;
    hideSuggestions();
    input.blur();
    renderResult(g);
  }

  // --- Render the seat map + result card ---
  function seatHTML(seat, viewer) {
    // The searching guest's own seat.
    if (seat && seat.name === viewer.name) {
      return '<div class="seat you" data-name="' + escapeHTML(seat.name) + '"' +
             (seat.quip ? ' data-quip="' + escapeHTML(seat.quip) + '"' : '') +
             '><span class="who">' + escapeHTML(seat.name) + '</span></div>';
    }
    // Members of the viewer's own party — shown by name.
    if (seat && seat.name && seat.party === viewer.party) {
      return '<div class="seat mate" data-name="' + escapeHTML(seat.name) + '"' +
             (seat.quip ? ' data-quip="' + escapeHTML(seat.quip) + '"' : '') +
             '><span class="who">' + escapeHTML(seat.name) + '</span></div>';
    }
    // Everyone else (other parties) AND empty seats — all anonymous.
    return '<div class="seat other">' + PERSON_SVG + '</div>';
  }

  var PERSON_SVG =
    '<svg class="silhouette" viewBox="0 0 24 24" aria-hidden="true">' +
      '<path d="M12 12a4.4 4.4 0 100-8.8 4.4 4.4 0 000 8.8z' +
              'M12 13.6c-4.3 0-7.6 2.2-7.6 5.4V20h15.2v-1c0-3.2-3.3-5.4-7.6-5.4z"/>' +
    '</svg>';

  function sideHTML(seats, viewer) {
    var cols = 'grid-template-columns: repeat(' + seats.length + ', minmax(0, 1fr));';
    return '<div class="side" style="' + cols + '">' +
      seats.map(function (s) { return seatHTML(s, viewer); }).join("") +
      '</div>';
  }

  // Room-level map: 2 columns (8-seaters | 12-seaters), guest's table lit up
  function byId(a, b) { return a.id - b.id; }
  function roomMapHTML(viewer) {
    // Venue layout: left column = 8-seat tables (the odd numbers 1,3,5,…),
    // right column = 12-seat tables (the even numbers 2,4,6,…). Each column is
    // sorted by table number, so they read top-to-bottom as odd / even.
    var col1 = data.tables.filter(function (t) { return t.capacity === 8; }).sort(byId);
    var col2 = data.tables.filter(function (t) { return t.capacity === 12; }).sort(byId);
    function cell(t) {
      var here = t.id === viewer.table;
      return '<div class="rt' + (here ? ' here' : '') + '">' +
        (here ? '<span class="youtag">You</span>' : '') + t.id + '</div>';
    }
    return '<div class="roommap">' +
      pigeonHTML("p4", "p-4") +
      '<div class="room-wall top">' +
        '<span class="wall"></span>' +
        '<span class="wall-label">Screen &middot; Front of room</span>' +
        '<span class="wall"></span>' +
      '</div>' +
      '<div class="rgrid">' +
        '<div class="rcol small">' + col1.map(cell).join("") + '</div>' +
        '<div class="rcol big">' + col2.map(cell).join("") + '</div>' +
      '</div>' +
      '<div class="entrance">' +
        '<div class="entrance-row">' +
          '<span class="e-spacer left"></span>' +
          '<div class="door-gap">' +
            '<span class="door-mask">' +
              '<svg class="door-icon" viewBox="0 0 34 24" aria-hidden="true">' +
                '<rect x="1" y="2" width="15" height="20" rx="1.5"></rect>' +
                '<rect x="18" y="2" width="15" height="20" rx="1.5"></rect>' +
                '<line x1="13" y1="10" x2="13" y2="14"></line>' +
                '<line x1="21" y1="10" x2="21" y2="14"></line>' +
              '</svg>' +
            '</span>' +
            '<span class="entrance-label">Entrance</span>' +
          '</div>' +
          '<span class="e-spacer right"></span>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  var swapTimer = null;    // in-flight card refresh
  var scrollTimer = null;  // pending scroll-to-card
  var cardFactStop = null; // rotating-fact interval inside the current card

  // Show the swipe hint only while the current seat map overflows the screen.
  function checkOverflow() {
    var seatmapEl = resultEl.querySelector(".seatmap");
    var scrollHint = document.getElementById("scrollHint");
    if (!seatmapEl || !scrollHint) return;
    if (seatmapEl.scrollWidth > seatmapEl.clientWidth + 2) scrollHint.removeAttribute("hidden");
    else scrollHint.setAttribute("hidden", "");
  }

  // Auto-fit seat names: shrink the font (uniformly across the table) just
  // enough that the longest single word fits on one line, so names wrap only
  // at spaces — never mid-word. Short names stay at full size.
  var fitCanvas;
  function fitNames() {
    var whos = resultEl.querySelectorAll(".seat .who");
    if (!whos.length) return;
    var available = whos[0].clientWidth - 1;   // seats in a table are equal width
    if (available <= 0) return;

    fitCanvas = fitCanvas || document.createElement("canvas");
    var ctx = fitCanvas.getContext("2d");
    var family = getComputedStyle(whos[0]).fontFamily;

    var words = [];
    whos.forEach(function (w) {
      (w.textContent || "").split(/\s+/).forEach(function (p) { if (p) words.push(p); });
    });
    function longestWordAt(px) {
      ctx.font = "600 " + px + "px " + family;
      var max = 0;
      words.forEach(function (word) {
        var wpx = ctx.measureText(word).width;
        if (wpx > max) max = wpx;
      });
      return max;
    }

    var px = 11;                 // full size (matches CSS)
    while (px > 7.5 && longestWordAt(px) > available) px -= 0.5;
    whos.forEach(function (w) { w.style.fontSize = px + "px"; });
  }

  function refit() { fitNames(); checkOverflow(); setNoteHeight(); }

  function cardHTML(viewer) {
    var t = tablesById[viewer.table];
    var notes = (window.WEDDING_CONTENT && window.WEDDING_CONTENT.partyNotes) || {};
    var raw = notes[viewer.party];
    // Normalise: accept a plain string, a single object, or a list.
    var list = [];
    if (typeof raw === "string") list = [{ text: raw }];
    else if (raw && !Array.isArray(raw)) list = [raw];
    else if (Array.isArray(raw)) list = raw;

    var noteHTML = "";
    if (list.length) {
      var slides = list.map(function (m) {
        return '<div class="note-slide">' +
          '<p class="note-text">' + escapeHTML(m.text) + '</p>' +
          (m.from ? '<span class="note-from">' + escapeHTML(m.from) + '</span>' : '') +
        '</div>';
      }).join("");
      var multi = list.length > 1;

      // Dynamic title based on who wrote the message(s).
      var content = window.WEDDING_CONTENT || {};
      var bride = content.bride || "";
      var groom = content.groom || "";
      var froms = list.map(function (m) { return (m.from || "").trim(); });
      var hasBride = bride && froms.some(function (f) { return f.indexOf(bride) > -1; });
      var hasGroom = groom && froms.some(function (f) { return f.indexOf(groom) > -1; });
      var role = (hasBride && hasGroom) ? "the couple"
               : hasBride ? "the bride"
               : hasGroom ? "the groom"
               : "the couple";

      var viewport = '<div class="note-viewport">' + slides + '</div>';
      var carousel = multi
        ? '<div class="note-carousel">' +
            '<span class="note-arrow-spacer" aria-hidden="true"></span>' +
            viewport +
            '<button type="button" class="note-arrow" data-dir="1" aria-label="Next message">&#8250;</button>' +
          '</div>'
        : viewport;

      noteHTML =
        '<div class="party-note">' +
          '<div class="note-label">Message from ' + role + '</div>' +
          carousel +
        '</div>';
    } else {
      // No message for this party → show a rotating fact in the same spot.
      noteHTML =
        '<div class="card-fact-wrap">' +
          '<div class="note-label">Did you know?</div>' +
          '<p class="fact" id="cardFact"></p>' +
          '<div class="fact-progress"><i id="cardFactBar"></i></div>' +
        '</div>';
    }

    return '<div class="card">' +
        pigeonHTML("p3", "p-3") +
        '<div class="name">' + escapeHTML(viewer.name) + '</div>' +
        '<span class="table-badge">You\'re at<b>Table ' + viewer.table + '</b></span>' +

        '<div class="disclosure">' +
          '<button class="disc-btn" id="roomToggle" aria-expanded="false">' +
            '<span class="disc-label">Huh? Where is Table ' + viewer.table + '?</span>' +
            '<span class="chev" aria-hidden="true">&#9654;</span>' +
          '</button>' +
          '<div class="disc-panel" id="roomPanel">' +
            '<div class="disc-panel-inner">' +
              '<div class="room-box">' +
                roomMapHTML(viewer) +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="seatmap-header">Your seat</div>' +
        '<div class="seatmap"><div class="seatmap-inner">' +
          sideHTML(t.top, viewer) +
          '<div class="table-surface">Table ' + viewer.table + '</div>' +
          sideHTML(t.bottom, viewer) +
        '</div></div>' +
        '<p class="scroll-hint" id="scrollHint" hidden>Swipe to see the whole table &rarr;</p>' +

        noteHTML +

        (whoGameData().length
          ? '<button type="button" class="game-invite" id="gameInvite">' +
              '<span class="gi-icon" aria-hidden="true">' +
                '<svg viewBox="0 0 24 24">' +
                  '<rect x="3" y="3" width="18" height="18" rx="4"></rect>' +
                  '<circle cx="8.5" cy="8.5" r="1.3"></circle>' +
                  '<circle cx="15.5" cy="8.5" r="1.3"></circle>' +
                  '<circle cx="12" cy="12" r="1.3"></circle>' +
                  '<circle cx="8.5" cy="15.5" r="1.3"></circle>' +
                  '<circle cx="15.5" cy="15.5" r="1.3"></circle>' +
                '</svg>' +
              '</span>' +
              '<span class="gi-text">' +
                '<span class="gi-kicker">While you wait…</span>' +
                '<span class="gi-title">Play “Who\'s more likely to…”</span>' +
              '</span>' +
              '<span class="gi-arrow" aria-hidden="true">&#8250;</span>' +
            '</button>'
          : '') +

        '<button class="again" id="againBtn">Search another name</button>' +
      '</div>';
  }

  function buildCard(viewer) {
    resultEl.innerHTML = cardHTML(viewer);
    requestAnimationFrame(refit);

    var roomToggle = document.getElementById("roomToggle");
    var roomPanel = document.getElementById("roomPanel");
    var roomScrollTimer;
    roomToggle.addEventListener("click", function () {
      var willOpen = !roomPanel.classList.contains("open");
      roomPanel.classList.toggle("open", willOpen);   // height glides both ways
      roomToggle.classList.toggle("open", willOpen);
      roomToggle.setAttribute("aria-expanded", String(willOpen));

      clearTimeout(roomScrollTimer);
      if (willOpen) {
        // After the panel finishes expanding (--dur), scroll it fully into view.
        roomScrollTimer = setTimeout(function () {
          if (roomPanel.classList.contains("open")) {
            roomPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }, 420);
      }
    });

    document.getElementById("againBtn").addEventListener("click", exitToLanding);

    var gameInvite = document.getElementById("gameInvite");
    if (gameInvite) gameInvite.addEventListener("click", openWhoGame);

    wireTapEasterEggs();
    wireNoteCarousel();

    // If this card shows a rotating fact (no party message), start it.
    clearInterval(cardFactStop);
    var cf = document.getElementById("cardFact");
    cardFactStop = cf ? startFacts(cf, document.getElementById("cardFactBar")) : null;

    hidePigeonsAlreadyFound();   // don't show card/room pigeons already caught
  }

  // Playful reactions when a guest taps a seat or a room-map table.
  var quipTimer = null;
  function randomFrom(arr) {
    return (arr && arr.length) ? arr[Math.floor(Math.random() * arr.length)] : "";
  }
  // Show a centered card. `name` optional (omitted for tables / anonymous).
  function showQuip(name, text) {
    var el = document.getElementById("quip");
    if (!el || !text) return;
    el.innerHTML =
      (name ? '<span class="quip-name">' + escapeHTML(name) + '</span>' : '') +
      '<span class="quip-text">' + escapeHTML(text) + '</span>';
    el.classList.add("show");
    clearTimeout(quipTimer);
    quipTimer = setTimeout(function () { el.classList.remove("show"); }, 2500);
  }
  function popEl(el) {
    el.classList.remove("pop");
    void el.offsetWidth;                 // restart the animation
    el.classList.add("pop");
  }
  function wireTapEasterEggs() {
    var C = window.WEDDING_CONTENT || {};
    var seatmapEl = resultEl.querySelector(".seatmap");
    if (seatmapEl) {
      seatmapEl.addEventListener("click", function (e) {
        var seat = e.target.closest(".seat");
        if (!seat) return;
        popEl(seat);
        if (seat.classList.contains("you")) {
          showQuip("You", seat.dataset.quip || "That's you — looking wonderful today!");
        } else if (seat.classList.contains("mate")) {
          showQuip(seat.dataset.name || "", seat.dataset.quip || randomFrom(C.defaultQuips));
        } else {
          showQuip("", randomFrom(C.mysteryLines) || "A guest you'll meet tonight.");
        }
      });
    }
    var rgrid = resultEl.querySelector(".rgrid");
    if (rgrid) {
      rgrid.addEventListener("click", function (e) {
        var rt = e.target.closest(".rt");
        if (!rt) return;
        popEl(rt);
        if (rt.classList.contains("here")) { showQuip("", "That's your table!"); }
        else {
          var n = (rt.textContent || "").replace(/\D+/g, "");
          showQuip("", "Table " + n + " — no peeking!");
        }
      });
    }
  }

  // ---- "Who's more likely to…" game (launched from the seat card) ----
  var gameEl = null, gameClose = null;

  function whoGameData() {
    var g = (window.WEDDING_CONTENT && window.WEDDING_CONTENT.whoMoreLikely) || [];
    return g.filter(function (q) {
      return q && q.prompt && (q.answer === "May" || q.answer === "Junyu" || q.answer === "Both");
    });
  }
  // Keep the fixed order from data.js (you control the answer spacing there),
  // but start on a random question and loop around — so each play begins
  // somewhere different while following the sequence you arranged.
  function rotate(list) {
    var s = Math.floor(Math.random() * list.length);
    return list.slice(s).concat(list.slice(0, s));
  }

  function openWhoGame() {
    var all = whoGameData();
    if (!all.length) return;
    var queue = rotate(all), idx = 0, score = 0;

    if (!gameEl) {
      gameEl = document.createElement("div");
      gameEl.className = "game-overlay";
      document.body.appendChild(gameEl);
      // Tap the dim backdrop (not the sheet) or press Esc to close.
      gameEl.addEventListener("click", function (e) { if (e.target === gameEl && gameClose) gameClose(); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && gameEl.classList.contains("show") && gameClose) gameClose();
      });
    }

    function close() {
      gameEl.classList.remove("show");
      document.body.classList.remove("game-open");
      setTimeout(function () {
        if (gameEl && !gameEl.classList.contains("show")) gameEl.innerHTML = "";
      }, 300);
    }
    gameClose = close;

    function frame(inner) {
      return '<div class="game-sheet">' +
          '<button type="button" class="game-close" aria-label="Close game">&times;</button>' +
          inner +
        '</div>';
    }
    function wireClose() {
      var x = gameEl.querySelector(".game-close");
      if (x) x.addEventListener("click", close);
    }

    function renderQuestion() {
      var q = queue[idx];
      var lastOne = idx + 1 >= queue.length;
      gameEl.innerHTML = frame(
        '<div class="game-progress">' + (idx + 1) + " / " + queue.length + '</div>' +
        '<div class="game-q">' +
          '<div class="game-kicker">Who\'s more likely to…</div>' +
          '<h2 class="game-prompt">' + escapeHTML(q.prompt) + '?</h2>' +
          '<div class="game-options">' +
            '<button type="button" class="wml" data-who="May">May</button>' +
            '<button type="button" class="wml" data-who="Junyu">Junyu</button>' +
          '</div>' +
          '<div class="game-reveal" hidden>' +
            '<p class="game-caption"></p>' +
            '<button type="button" class="game-next">' + (lastOne ? "See results" : "Next") + ' &#8250;</button>' +
          '</div>' +
        '</div>' +
        (idx === 1 ? pigeonHTML("p6", "p-6") : "")   // a pigeon on the 2nd question
      );
      wireClose();
      hidePigeonsAlreadyFound();

      var opts = gameEl.querySelectorAll(".wml");
      var reveal = gameEl.querySelector(".game-reveal");
      var caption = gameEl.querySelector(".game-caption");

      opts.forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (reveal.hidden === false) return;      // already answered
          var picked = btn.getAttribute("data-who");
          var correct = q.answer;
          var isBoth = correct === "Both";
          var matched = isBoth || picked === correct;   // Both = either tap matches
          if (matched) score++;
          opts.forEach(function (b) {
            b.disabled = true;
            var who = b.getAttribute("data-who");
            if (isBoth || who === correct) b.classList.add("is-answer");
            else if (who === picked) b.classList.add("is-wrong");
          });
          caption.textContent = isBoth
            ? "Both of us, actually! " + (q.note || "")
            : matched
              ? "You matched us! " + (q.note || "")
              : "We'd say " + correct + ". " + (q.note || "");
          reveal.hidden = false;
        });
      });
      gameEl.querySelector(".game-next").addEventListener("click", function () {
        idx++;
        if (idx < queue.length) renderQuestion();
        else renderEnd();
      });
    }

    function renderEnd() {
      var n = queue.length;
      var line = score === n ? "You know us inside out!"
               : score >= Math.ceil(n * 0.6) ? "You know us pretty well!"
               : score >= Math.ceil(n * 0.3) ? "Not bad — you'll know us better by dessert."
               : "Come find us — we clearly have stories to tell!";
      gameEl.innerHTML = frame(
        '<div class="game-end">' +
          '<div class="game-kicker">All done!</div>' +
          '<h2 class="game-score">You matched us ' + score + " / " + n + '</h2>' +
          '<p class="game-endline">' + escapeHTML(line) + '</p>' +
          '<div class="game-endbtns">' +
            '<button type="button" class="game-again">Play again</button>' +
            '<button type="button" class="game-back">Back to my seat</button>' +
          '</div>' +
        '</div>' +
        pigeonHTML("p5", "p-5")
      );
      wireClose();
      hidePigeonsAlreadyFound();
      gameEl.querySelector(".game-again").addEventListener("click", function () {
        queue = rotate(all); idx = 0; score = 0; renderQuestion();
      });
      gameEl.querySelector(".game-back").addEventListener("click", close);
    }

    document.body.classList.add("game-open");
    renderQuestion();
    requestAnimationFrame(function () { gameEl.classList.add("show"); });
  }

  // Arrow navigation for the party-note carousel (2+ messages only).
  // Slides always enter from the side matching the arrow, so "next" (›) reads
  // as forward even when looping from the last message back to the first.
  function wireNoteCarousel() {
    var pn = resultEl.querySelector(".party-note");
    if (!pn) return;
    var slides = pn.querySelectorAll(".note-carousel .note-slide");
    var arrows = pn.querySelectorAll(".note-arrow");
    if (slides.length < 2) return;

    var idx = 0;
    slides.forEach(function (s, i) {
      s.style.transform = "translateX(" + (i === 0 ? 0 : 100) + "%)";
    });

    function go(dir) {
      var n = slides.length;
      var newIdx = ((idx + dir) % n + n) % n;
      if (newIdx === idx) return;
      var cur = slides[idx], nxt = slides[newIdx];
      nxt.style.transition = "none";
      nxt.style.transform = "translateX(" + (dir > 0 ? 100 : -100) + "%)";
      void nxt.offsetWidth;                    // commit the start position
      nxt.style.transition = "";               // back to the CSS transition
      requestAnimationFrame(function () {
        cur.style.transform = "translateX(" + (dir > 0 ? -100 : 100) + "%)";
        nxt.style.transform = "translateX(0)";
      });
      idx = newIdx;
    }
    arrows.forEach(function (a) {
      a.addEventListener("click", function () {
        go(parseInt(a.getAttribute("data-dir"), 10));
      });
    });
  }

  // Give the carousel viewport a fixed height (tallest message) since its
  // slides are absolutely positioned. Recomputed on resize via refit().
  function setNoteHeight() {
    var vp = resultEl.querySelector(".note-carousel .note-viewport");
    if (!vp) return;
    var slides = vp.querySelectorAll(".note-slide");
    var maxH = 0;
    slides.forEach(function (s) { if (s.offsetHeight > maxH) maxH = s.offsetHeight; });
    if (maxH) vp.style.height = maxH + "px";
  }

  // Fade the card in, then scroll it to the top so it dominates the screen.
  function showCard() {
    requestAnimationFrame(function () { resultEl.classList.add("show"); });
    clearTimeout(scrollTimer);
    // Short delay lets the mobile keyboard begin closing so the scroll target
    // is accurate. Kept small for snappiness; bump up if scroll lands off.
    scrollTimer = setTimeout(function () {
      resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }


  function renderResult(viewer) {
    if (wrapEl.classList.contains("has-result")) {
      // A card is already showing → visibly refresh: fade out, swap, fade in.
      clearTimeout(swapTimer);
      resultEl.classList.remove("show");
      swapTimer = setTimeout(function () {
        buildCard(viewer);
        showCard();
      }, 400);   // matches the card fade-out (--dur)
    } else {
      wrapEl.classList.add("has-result");
      buildCard(viewer);
      showCard();
    }
  }

  function exitToLanding() {
    clearTimeout(swapTimer);
    clearInterval(cardFactStop);
    input.value = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
    resultEl.classList.remove("show");        // card eases out (--dur)
    wrapEl.classList.remove("has-result");
    centerLanding();                          // ensure header is centered on return
    setTimeout(function () {
      resultEl.innerHTML = "";
      input.focus();
    }, 400);
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c];
    });
  }

  // ---- Hidden-pigeon hunt (a nod to the "we can sex a pigeon" fact) ----
  var PIGEON_TOTAL = 5;
  // Several pigeon designs for variety. Each shape uses currentColor (via CSS)
  // so it themes in light/dark. Add more entries here to get more variety.
  var PIGEON_SVGS = [
    // 0 — pigeon (SVG Repo #173788) — also used for the counter glyph
    '<svg viewBox="0 0 334.966 334.966" aria-hidden="true"><path d="M287.112,280.184c-5.763-1.863-11.207-3.623-15.804-5.347c-6.204-2.326-7.655-3.394-7.976-3.816c0.337-0.31,1.403-0.783,2.133-1.106c2.534-1.124,6.004-2.663,6.199-6.164c0.234-4.221-3.748-12.339-40.871-34.007c-28.763-16.789-37.888-32.28-48.454-50.218c-5.918-10.047-12.038-20.437-22.159-32.278c-2.814-3.292-6.402-7-10.556-11.293c-17.204-17.78-43.202-44.65-45.027-76.8C102.29,18.353,72.418,0,51.944,0l-0.505,0.003C38.221,0.19,29.167,8.839,23.899,16.064c-2.447,3.365-6.952,7.625-9.947,9.925c-3.649,2.793-6.52,6.137-8.529,9.935c-0.928,1.734-1.002,3.419-0.208,4.745c1.006,1.679,3.227,2.532,5.987,2.208c2.164-0.25,4.145-0.372,6.056-0.372c8.99,0,15.497,2.658,19.338,7.9c5.474,7.469,5.451,20.112-0.067,37.575c-15.688,49.652-20.239,86.361-13.914,112.227c8.139,33.301,19.381,53.593,58.244,72.092c3.723,1.772,7.853,3.315,12.309,4.698c-2.813,8.571-5.917,17.043-8.701,22.407c-0.209,0.404-0.333,0.88-0.454,1.34c-0.051,0.193-0.123,0.468-0.194,0.679c-0.609-0.347-1.778-1.235-2.832-2.036c-1.729-1.314-3.881-2.949-6.163-4.328c-4.237-2.56-7.525-3.752-10.346-3.752c-2.164,0-3.752,0.702-5.021,1.389c-0.316,0.171-1.058,0.573-0.872,1.39c0.187,0.821,0.946,0.859,1.75,0.898c2.061,0.1,7.414,0.363,12.548,5.818c-2.316-0.067-7.405-1.078-15.532-3.091c-0.946-0.234-1.882-0.345-2.783-0.345c-6.728,0-10.058,6.408-11.312,8.815c-0.164,0.315-0.28,0.583-0.349,0.682l-0.452,0.627l0.549,1.281h0.636c0.306,0,0.484-0.227,0.959-0.5c7.506-4.305,16.275-5.03,24.988-1.808c2.541,0.939,3.99,2.123,4.786,3.05c-0.237,0.181-0.461,0.372-0.681,0.566c-2.252-0.094-4.046-0.139-5.532-0.139c-2.385,0-3.682,0.114-5.184,0.247c-1.446,0.127-3.085,0.272-6.121,0.336c-2.174,0.046-4.222,0.381-5.922,0.97c-4.858,1.682-7.161,4.85-7.268,4.999l-3.077,4.486l-0.09,0.16c-0.36,0.814-0.392,1.459-0.094,1.917c0.378,0.581,1.126,0.721,1.97,0.187c6.496-4.108,11.776-6.024,16.618-6.024c3.119,0,5.727,0.795,8.249,1.567c2.442,0.748,4.968,1.514,7.854,1.514c1.122,0,2.217-0.125,3.35-0.355c1.598-0.326,3.095-0.705,4.543-1.047c3.673-0.869,6.846-1.669,10.31-1.669c1.641,0,3.297,0.182,4.997,0.547c1.362,0.855,2.148,1.729,2.552,2.353c-2.808-0.129-4.954-0.189-6.687-0.189c-2.385,0-3.682,0.114-5.184,0.247c-1.446,0.127-3.085,0.272-6.121,0.336c-2.174,0.046-4.222,0.381-5.922,0.97c-4.858,1.682-7.161,4.85-7.268,4.999l-3.077,4.486l-0.09,0.16c-0.36,0.814-0.392,1.459-0.094,1.917c0.378,0.581,1.126,0.721,1.97,0.187c6.496-4.108,11.776-6.024,16.618-6.024c3.119,0,5.727,0.795,8.249,1.567c2.442,0.748,4.968,1.514,7.854,1.514c1.122,0,2.217-0.125,3.35-0.355c1.598-0.326,3.095-0.705,4.543-1.047c3.673-0.869,6.846-1.669,10.31-1.669c5.895,0,11.964,2.251,19.679,7.521l0.344,0.019h0.309l0.639,0.192l0.274-0.363c0.32-0.657,0.32-0.657-2.122-3.779c-2.821-3.607-10.316-13.188-9.835-15.774c1.309-7.024,4.622-18.541,7.997-29.46c6.568,0.91,13.393,1.785,20.45,2.685c16.189,2.065,34.539,4.407,53.473,7.71c8.786,1.534,18.044,3.249,26.997,4.907c28.875,5.35,58.734,10.881,76.092,10.881c7.998,0,12.991-1.161,15.262-3.549c1.027-1.08,1.509-2.398,1.433-3.918C329.772,293.974,307.108,286.647,287.112,280.184z M110.015,310.745c-0.051,0.193-0.123,0.468-0.194,0.679c-0.609-0.347-1.778-1.235-2.832-2.036c-1.232-0.936-2.685-2.034-4.24-3.088c-0.159-0.506-0.223-0.932-0.164-1.251c1.094-5.869,3.587-14.877,6.346-24.05c3.677,0.766,7.517,1.471,11.483,2.139c-3.12,9.816-6.744,20.096-9.946,26.267C110.259,309.809,110.135,310.285,110.015,310.745z"></path></svg>',
    // 1 — pigeon (SVG Repo #131435, recoloured to currentColor)
    '<svg viewBox="0 0 567.803 567.803" aria-hidden="true"><path d="M429.216,140.669c-3.55-18.124-3.24-37.071-6.238-55.337c-4.076-24.831-12.575-50.074-30.698-67.528c-22.48-21.652-56.039-23.705-81.065-5.336c-2.306,1.689-2.962,5.7-4.219,8.715c-0.396,0.951-0.723,1.934-1.053,2.991c-0.522,1.673-1.392,3.407-1.95,3.859c-0.339,0.273-0.673,0.547-1.012,0.82c-0.196,0.159-0.375,0.334-0.547,0.522c-0.277,0.306-2.057,1.485-4.035,2.566c-6.883,3.762-13.839,7.267-19.841,11.983c-3.794,2.982-6.324,7.577-9.033,11.942c-1.191,1.914-1.889,3.737-1.461,4.141c0.429,0.404,2.579,0.428,4.807,0.073c1.636-0.261,3.239-0.587,4.696-1.249c26.88-12.179,56.08,5.9,57.631,35.362c0.93,17.658-6.912,34.557-15.855,49.809c-6.512,11.102-15.083,29.454-25.581,37.189c-9.03,6.654-18.838,5.965-28.659,12.007c-22.26,13.693-38.075,42.938-51.147,64.603c-12.791,21.195-24.121,43.248-37.43,64.113c-12.448,19.519-29.343,35.186-42.856,53.048c-1.358,1.795-1.628,4.892-0.922,7.03c0.6,1.807,1.252,3.985,1.705,5.866c0.531,2.191,2.464,4.183,4.333,5.439c11.379,7.658-26.805,37.009-38.784,46.883c-1.738,1.433-1.269,2.938,0.971,3.17c30.413,3.146,64.085-6.356,90.927-17.14c2.774-1.114,5.353-2.782,7.891-4.398c4.569-2.909,8.988-6.055,13.558-8.964c4.872-3.101,47.524-3.386,42.82,5.944c-11.795,23.391,0.702,47.586,4.614,71.127c1.595,9.584,0.008,17.263-1.697,24.803c-0.498,2.199-2.701,4.247-4.917,4.655c-8.213,1.514-15.646,3.847-9.869,6.907c4.5,2.383,7.678,5.312,9.857,7.923c1.444,1.73,2.554,5.121,2.93,7.345c1.387,8.286,4.484,16.813,7.274,24.541c0.767,2.117,2.358,2.297,3.517,0.363c9.731-16.219,12.252-25.59,31.996-21.167c13.003,2.909,26.247,6.858,39.271,9.62c2.207,0.47,2.513-0.257,0.689-1.583c-6.516-4.741-12.999-9.563-19.837-13.818c-1.914-1.191-1.755-1.506,0.473-1.188c11.738,1.677,14.754-8.136,21.608-12.146c1.946-1.139,1.999-1.098-0.217-0.686c-9.837,1.82-19.796,3.346-29.727,2.379c-29.319-2.852-38.059-26.761-33.252-54.301c2.505-14.361,15.537-61.849,30.409-67.557c7.368-2.827,15.806,2.668,19.074,9.85c3.271,7.177,2.758,15.43,2.248,23.301c-0.511,7.87-0.878,16.16,2.627,23.228c3.146,6.34,8.98,10.824,13.75,16.055c4.77,5.227,8.727,12.333,6.781,19.135c-1.747,6.116-7.94,10.114-14.207,11.188c-4.933,0.845-9.951,0.216-14.9-0.723c-2.215-0.42-3.039,0.8-1.31,2.244c12.077,10.086,41.294,0.547,35.146,22.347c-1.273,4.504-2.297,9.082-3.387,13.774c-0.51,2.194,0.734,3.215,2.697,2.108c8.237-4.626,13.476-10.881,12.195-21.444c-0.155-1.285,47.564,12.971,50.637,13.962c3.7,1.195,7.601,1.791,11.922,2.546c2.219,0.388,3.488-1.008,2.709-3.121c-2.236-6.083-5.022-10.212-12-11.452c-6.658-1.188-13.284-3.183-19.693-5.455c-2.126-0.751-2.012-1.433,0.24-1.318c12.016,0.596,37.038,3.391,37.087-8.992c0.009-2.252-2.509-3.7-4.716-3.252c-4.247,0.869-8.52,1.86-12.771,1.767c-15.985-0.358-34.138,2.469-46.206-8.115c-11.836-10.375-14.521-33.215-13.537-47.735c5.002-73.995,79.294-114.281,100.678-183.286c10.33-33.346,1.938-63.252-15.435-92.367C440.158,165.557,432.512,157.499,429.216,140.669z"></path></svg>'
  ];
  var PIGEON_SVG = PIGEON_SVGS[0];   // the counter glyph uses the first design (#173788)
  function pigeonSvgFor(id) {
    var n = parseInt(String(id).replace(/\D/g, ""), 10) || 0;
    return PIGEON_SVGS[n % PIGEON_SVGS.length];   // deterministic per id, so it won't change on re-render
  }
  function pigeonHTML(id, cls) {
    return '<button type="button" class="pigeon ' + cls + '" data-pigeon="' + id +
      '" aria-label="A hidden pigeon — tap to catch it">' + pigeonSvgFor(id) + '</button>';
  }
  // In-memory only (not persisted) so a page refresh resets the hunt. The count
  // still carries across views within a visit, since navigating doesn't reload.
  var pigeonState = [];
  function pigeonsFound() { return pigeonState; }
  function savePigeons(a) { pigeonState = a; }
  function updatePigeonCount(pop) {
    var el = document.getElementById("pigeonCount");
    var txt = document.getElementById("pigeonCountText");
    if (!el || !txt) return;
    txt.textContent = pigeonsFound().length + " / " + PIGEON_TOTAL;
    el.hidden = false;
    if (pop) { el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }
  }
  function hidePigeonsAlreadyFound() {
    var found = pigeonsFound();
    var list = document.querySelectorAll(".pigeon");
    for (var i = 0; i < list.length; i++) {
      if (found.indexOf(list[i].getAttribute("data-pigeon")) > -1) list[i].remove();
    }
  }
  function catchPigeon(el) {
    var id = el.getAttribute("data-pigeon");
    var found = pigeonsFound();
    if (found.indexOf(id) > -1) { el.remove(); return; }
    found.push(id);
    savePigeons(found);
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { el.remove(); }
    else { el.classList.add("flit"); setTimeout(function () { el.remove(); }, 700); }
    updatePigeonCount(true);
    var n = found.length;
    showQuip("", n >= PIGEON_TOTAL
      ? "That's all " + PIGEON_TOTAL + " pigeons! Now ask us to guess their genders."
      : "You found a pigeon! " + n + " / " + PIGEON_TOTAL + " — keep looking.");
  }
  function initPigeons() {
    if (!document.getElementById("pigeonCount")) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "pigeon-count";
      c.id = "pigeonCount";
      c.hidden = true;
      c.setAttribute("aria-label", "Pigeons found — tap to see your count");
      c.innerHTML = '<span class="pigeon-glyph" aria-hidden="true">' + PIGEON_SVG +
        '</span><span class="pc-num" id="pigeonCountText"></span>';
      c.addEventListener("click", function () {
        document.getElementById("pigeonCountText").textContent =
          pigeonsFound().length + " / " + PIGEON_TOTAL;
        c.classList.toggle("open");   // reveal / hide the count on tap
      });
      document.body.appendChild(c);
    }
    var hero = document.querySelector(".hero");
    if (hero && !hero.querySelector(".pigeon")) hero.insertAdjacentHTML("beforeend", pigeonHTML("p1", "p-1"));
    hidePigeonsAlreadyFound();
    if (pigeonsFound().length > 0) updatePigeonCount(false);
  }

  // --- Events ---
  // Tapping the couple's names returns to the landing page (only meaningful
  // while a seat card is showing).
  var namesEl = document.querySelector(".names");
  if (namesEl) {
    namesEl.addEventListener("click", function () {
      if (wrapEl.classList.contains("has-result")) exitToLanding();
    });
  }

  input.addEventListener("input", renderSuggestions);
  input.addEventListener("focus", function () {
    // If a result card is already showing, clear the box so the guest can type
    // a fresh name straight away (the previous card stays in the background).
    if (wrapEl.classList.contains("has-result")) {
      input.value = "";
      hideSuggestions();
      return;
    }
    if (input.value) renderSuggestions();
  });
  window.addEventListener("resize", refit);
  input.addEventListener("keydown", function (e) {
    if (!sugEl.classList.contains("open")) return;
    if (e.key === "ArrowDown") { e.preventDefault(); moveActive(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); moveActive(-1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex > -1 && currentMatches[activeIndex]) {
        choose(currentMatches[activeIndex]);
      } else if (currentMatches.length === 1) {
        choose(currentMatches[0]);
      }
    } else if (e.key === "Escape") {
      hideSuggestions();
    }
  });
  document.addEventListener("click", function (e) {
    var pigeon = e.target.closest(".pigeon");
    if (pigeon) { e.preventDefault(); catchPigeon(pigeon); return; }
    if (!e.target.closest(".search")) hideSuggestions();
    // Tap anywhere (except a seat/table, which open their own quip) to dismiss.
    var q = document.getElementById("quip");
    if (q && q.classList.contains("show") &&
        !e.target.closest(".seat") && !e.target.closest(".rt")) {
      q.classList.remove("show");
      clearTimeout(quipTimer);
    }
  });

  // --- Easter eggs ---
  var CONTENT = window.WEDDING_CONTENT || {};

  // Rotating fact — reusable for the landing page AND for result cards that
  // have no personal message. Returns the interval id (or null) so callers
  // can stop it. Gentle cross-fade; the progress bar resets each cycle.
  function startFacts(factEl, barEl) {
    var facts = (window.WEDDING_CONTENT && window.WEDDING_CONTENT.facts) || [];
    var progressEl = barEl ? barEl.parentNode : null;
    var DISPLAY = 7500;   // longer, so the wordier facts are comfortable to read

    if (!factEl || !facts.length) {
      // hide the whole wrapper (label + fact + bar) if there are no facts
      if (factEl && factEl.parentNode) factEl.parentNode.style.display = "none";
      else if (factEl) factEl.style.display = "none";
      return null;
    }

    // Cycle in order (random entry point, then sequential) so a fact never
    // repeats back-to-back and every fact gets shown before any repeats.
    var idx = Math.floor(Math.random() * facts.length);
    var started = false;
    function pick() {
      // Re-read the global each time so facts loaded from the sheet after boot
      // roll in on the next rotation, without needing a page reload.
      var live = (window.WEDDING_CONTENT && window.WEDDING_CONTENT.facts) || facts;
      if (!live.length) live = facts;
      if (!started) started = true;
      else idx = idx + 1;
      if (idx >= live.length) idx = 0;
      var f = live[idx];
      // A fact is a plain string, or { text, by } to sign it.
      return (f && typeof f === "object") ? { text: f.text || "", by: f.by || "" }
                                          : { text: String(f), by: "" };
    }
    function render(f) {
      // textContent first (clears any previous signature), then append a
      // signature line — kept present-but-empty when unsigned so the fact's
      // height stays constant across rotations (no layout jump).
      factEl.textContent = "“" + f.text + "”";
      var sig = document.createElement("span");
      sig.className = "fact-by";
      sig.textContent = f.by ? "— " + f.by : "";
      factEl.appendChild(sig);
    }
    function restartBar() {
      if (!barEl) return;
      barEl.style.animation = "none";
      void barEl.offsetWidth;          // force reflow so the animation restarts
      barEl.style.animation = "factProgress " + DISPLAY + "ms linear";
    }

    // Reserve the height of the TALLEST fact at this element's current width,
    // so the card/landing doesn't grow or shrink as facts rotate. Measured on
    // an off-screen clone (same classes → same font & wrapping), so it adapts
    // to whatever width this actually is (landing vs. card, any phone).
    function reserveHeight() {
      if (!factEl || !document.body.contains(factEl)) return;
      var live = (window.WEDDING_CONTENT && window.WEDDING_CONTENT.facts) || facts;
      var w = factEl.getBoundingClientRect().width;
      if (!w) return;
      var probe = factEl.cloneNode(false);
      probe.removeAttribute("id");
      probe.style.cssText = "position:absolute;left:-9999px;top:0;visibility:hidden;" +
                            "height:auto;min-height:0;width:" + w + "px";
      factEl.parentNode.appendChild(probe);
      var max = 0;
      for (var k = 0; k < live.length; k++) {
        var it = live[k];
        var t = (it && typeof it === "object") ? (it.text || "") : String(it);
        var by = (it && typeof it === "object") ? (it.by || "") : "";
        probe.textContent = "“" + t + "”";
        var s = document.createElement("span");
        s.className = "fact-by";
        s.textContent = by ? "— " + by : "";
        probe.appendChild(s);
        if (probe.offsetHeight > max) max = probe.offsetHeight;
      }
      probe.remove();
      if (max) factEl.style.minHeight = max + "px";
    }
    reserveHeight();
    // Custom font wraps differently than the fallback — re-measure once it loads.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(reserveHeight);

    render(pick());

    if (facts.length > 1) {
      restartBar();
      return setInterval(function () {
        factEl.classList.add("fading");
        setTimeout(function () {
          render(pick());
          factEl.classList.remove("fading");
          restartBar();
        }, 400);   // matches --dur
      }, DISPLAY);
    }
    if (progressEl) progressEl.style.display = "none";
    return null;
  }

  // Landing-page fact.
  startFacts(document.getElementById("fact"), document.getElementById("factBar"));

  // Hidden-pigeon hunt: drop the two landing pigeons + restore saved progress.
  initPigeons();

  // Center the landing view first, THEN enable the glide transition, so the
  // initial placement doesn't animate — only later movements glide.
  centerLanding();
  requestAnimationFrame(function () { wrapEl.classList.add("glide"); });
  window.addEventListener("orientationchange", function () {
    setTimeout(centerLanding, 250);   // wait for the new viewport dimensions
  });
  }  /* end initApp */

  // Dark-mode toggle. The initial theme is set by an inline <head> script (so
  // there's no flash); this just flips it on click and remembers the choice.
  function wireThemeToggle() {
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    var root = document.documentElement;
    function sync() {
      var dark = root.getAttribute("data-theme") === "dark";
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    }
    sync();
    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      sync();
    });
  }

  // Boot: start the app immediately with baked data.js so the page is
  // responsive right away, then silently load live sheet data in the background.
  // Seating globals are updated before the user finishes typing their name.
  wireThemeToggle();
  initApp();
  if (typeof Promise !== "undefined" && typeof fetch !== "undefined") {
    loadLiveData();
  }
})();
