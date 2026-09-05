(function () {
  /* ===== Live seating from a published Google Sheet (optional) =====
     Publish each tab: File > Share > Publish to web > (pick tab) > CSV,
     then paste the CSV links below. Leave "" to use the baked data.js only.
     The page ALWAYS falls back to data.js if a fetch is missing or fails. */
  var SHEETS = {
    guests:   "",   // Guests tab  -> published CSV url
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
    return Promise.all([fetchCSV(SHEETS.guests), fetchCSV(SHEETS.facts)])
      .then(function (res) {
        var g = res[0], f = res[1];
        if (g && g.length) window.SEATING_DATA = { tables: buildSeatingFromRows(g) };
        var content = window.WEDDING_CONTENT || {};
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
      return '<div class="rt' + (here ? ' here' : '') + '">' + t.id + '</div>';
    }
    return '<div class="roommap">' +
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

  function refit() { fitNames(); checkOverflow(); }

  // Open (or toggle) the collapsible seat-map panel. Pass true to force it open
  // (used when the guest taps their own table on the room map).
  var seatScrollTimer = null;
  function toggleSeatPanel(forceOpen) {
    var btn = document.getElementById("seatToggle");
    var panel = document.getElementById("seatPanel");
    if (!btn || !panel) return;
    var isOpen = panel.classList.contains("open");
    if (forceOpen && isOpen) {
      panel.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    var willOpen = forceOpen ? true : !isOpen;
    panel.classList.toggle("open", willOpen);   // height glides both ways
    btn.classList.toggle("open", willOpen);
    btn.setAttribute("aria-expanded", String(willOpen));

    clearTimeout(seatScrollTimer);
    if (willOpen) {
      // Seat widths (for name auto-fit + overflow hint) can only be measured
      // once the panel is actually visible — re-run the fit on expand.
      requestAnimationFrame(refit);
      // After the panel finishes expanding (--dur), scroll it fully into view.
      seatScrollTimer = setTimeout(function () {
        if (panel.classList.contains("open")) {
          panel.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 420);
    }
  }

  function cardHTML(viewer) {
    var t = tablesById[viewer.table];

    // Does anyone from another party share this table? (Drives the legend that
    // explains the anonymous silhouettes; skipped when the whole table is yours.)
    var hasOthers = t.top.concat(t.bottom).some(function (s) {
      return s && s.party !== viewer.party;
    });
    var legendHTML = hasOthers
      ? '<p class="seat-legend">' + PERSON_SVG + '<span>Other guests at your table</span></p>'
      : '';

    return '<div class="card">' +
        '<div class="name">' + escapeHTML(viewer.name) + '</div>' +
        '<span class="table-badge">You\'re at<b>Table ' + viewer.table + '</b></span>' +

        // Room map — always visible: the primary "where's my table" answer.
        '<div class="roomsection">' +
          '<div class="room-box">' +
            roomMapHTML(viewer) +
          '</div>' +
        '</div>' +

        // Seat map — collapsible detail: the secondary "where exactly do I sit".
        '<div class="disclosure">' +
          '<button class="disc-btn" id="seatToggle" aria-expanded="false">' +
            '<span class="disc-label">See your exact seat</span>' +
            '<span class="chev" aria-hidden="true">&#8250;</span>' +
          '</button>' +
          '<div class="disc-panel" id="seatPanel">' +
            '<div class="disc-panel-inner">' +
              '<div class="seatmap"><div class="seatmap-inner">' +
                sideHTML(t.top, viewer) +
                '<div class="table-surface">Table ' + viewer.table + '</div>' +
                sideHTML(t.bottom, viewer) +
              '</div></div>' +
              '<p class="scroll-hint" id="scrollHint" hidden>Swipe to see the whole table &rarr;</p>' +
              legendHTML +
            '</div>' +
          '</div>' +
        '</div>' +

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
      '</div>';
  }

  function buildCard(viewer) {
    resultEl.innerHTML = cardHTML(viewer);
    requestAnimationFrame(refit);

    document.getElementById("seatToggle").addEventListener("click", function () {
      toggleSeatPanel();
    });

    var gameInvite = document.getElementById("gameInvite");
    if (gameInvite) gameInvite.addEventListener("click", openWhoGame);

    wireRoomMapNav();
  }

  function popEl(el) {
    el.classList.remove("pop");
    void el.offsetWidth;                 // restart the animation
    el.classList.add("pop");
  }
  // Tapping the guest's own (highlighted) table on the room map opens the
  // collapsible seat-map detail — a natural "that's my table, show me my seat".
  function wireRoomMapNav() {
    var rgrid = resultEl.querySelector(".rgrid");
    if (!rgrid) return;
    rgrid.addEventListener("click", function (e) {
      var rt = e.target.closest(".rt.here");
      if (!rt) return;
      popEl(rt);
      toggleSeatPanel(true);
    });
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
        '</div>'
      );
      wireClose();

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
        '</div>'
      );
      wireClose();
      gameEl.querySelector(".game-again").addEventListener("click", function () {
        queue = rotate(all); idx = 0; score = 0; renderQuestion();
      });
      gameEl.querySelector(".game-back").addEventListener("click", close);
    }

    document.body.classList.add("game-open");
    renderQuestion();
    requestAnimationFrame(function () { gameEl.classList.add("show"); });
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
    if (!e.target.closest(".search")) hideSuggestions();
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
