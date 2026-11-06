// Lê o arquivo BibTeX e monta a lista de publicações agrupada por ano.
(function () {
  "use strict";

  var container = document.getElementById("publications");
  if (!container) return;
  var search = document.getElementById("pub-search");
  var counter = document.getElementById("pub-count");

  // ---------- Parser BibTeX ----------
  function parseBib(src) {
    var entries = [];
    var i = 0, n = src.length;

    function skipWs() { while (i < n && /\s/.test(src[i])) i++; }

    function readBraced() { // src[i] === '{'
      var depth = 0, start = i + 1;
      for (; i < n; i++) {
        if (src[i] === "\\") { i++; continue; }
        if (src[i] === "{") depth++;
        else if (src[i] === "}") { depth--; if (depth === 0) { i++; return src.slice(start, i - 1); } }
      }
      return src.slice(start);
    }

    function readQuoted() { // src[i] === '"'
      var depth = 0, start = ++i;
      for (; i < n; i++) {
        if (src[i] === "\\") { i++; continue; }
        if (src[i] === "{") depth++;
        else if (src[i] === "}") depth--;
        else if (src[i] === '"' && depth === 0) { i++; return src.slice(start, i - 1); }
      }
      return src.slice(start);
    }

    function readValue() {
      var parts = [];
      for (;;) {
        skipWs();
        if (src[i] === "{") parts.push(readBraced());
        else if (src[i] === '"') parts.push(readQuoted());
        else {
          var m = /^[^,}#\s]+/.exec(src.slice(i));
          if (!m) break;
          parts.push(m[0]); i += m[0].length;
        }
        skipWs();
        if (src[i] === "#") { i++; continue; }
        break;
      }
      return parts.join("");
    }

    while (i < n) {
      var at = src.indexOf("@", i);
      if (at < 0) break;
      i = at + 1;
      var tm = /^([A-Za-z]+)\s*[{(]/.exec(src.slice(i));
      if (!tm) continue;
      var type = tm[1].toLowerCase();
      i += tm[0].length;
      if (type === "comment" || type === "preamble" || type === "string") {
        i--; if (src[i] === "{") readBraced();
        continue;
      }
      var entryStart = at;
      skipWs();
      var km = /^[^,\s]+/.exec(src.slice(i));
      var key = km ? km[0] : "";
      i += key.length;
      var fields = {};
      for (;;) {
        skipWs();
        if (src[i] === ",") { i++; skipWs(); }
        if (i >= n || src[i] === "}" || src[i] === ")") { i++; break; }
        var fm = /^([A-Za-z0-9_\-:]+)\s*=\s*/.exec(src.slice(i));
        if (!fm) { // entrada malformada: pula até o fim da linha
          var nl = src.indexOf("\n", i); i = nl < 0 ? n : nl + 1; continue;
        }
        i += fm[0].length;
        fields[fm[1].toLowerCase()] = readValue();
      }
      entries.push({ type: type, key: key, fields: fields, raw: src.slice(entryStart, i).trim() });
    }
    return entries;
  }

  // ---------- LaTeX -> texto ----------
  var ACCENTS = {
    "'": "́", "`": "̀", "^": "̂", "~": "̃", '"': "̈",
    "c": "̧", "=": "̄", ".": "̇", "u": "̆", "v": "̌", "H": "̋", "k": "̨"
  };
  var SYMBOLS = { "ss": "ß", "o": "ø", "O": "Ø", "ae": "æ", "AE": "Æ", "l": "ł", "L": "Ł", "i": "ı", "aa": "å", "AA": "Å" };

  function delatex(s) {
    if (!s) return "";
    s = s.replace(/\\([`'^~"=.])\s*\{?\\?([A-Za-z])\}?/g, function (_, a, c) { return (c + ACCENTS[a]).normalize("NFC"); });
    s = s.replace(/\\([cuvHk])\s*\{\\?([A-Za-z])\}/g, function (_, a, c) { return (c + ACCENTS[a]).normalize("NFC"); });
    s = s.replace(/\\([cuvHk])\s+([A-Za-z])/g, function (_, a, c) { return (c + ACCENTS[a]).normalize("NFC"); });
    s = s.replace(/\\(ss|ae|AE|aa|AA|o|O|l|L|i)(?![A-Za-z])\s?/g, function (_, c) { return SYMBOLS[c]; });
    s = s.replace(/\\&/g, "&").replace(/\\%/g, "%").replace(/\\_/g, "_").replace(/\\\$/g, "$");
    s = s.replace(/\\(textit|textbf|emph|textrm|mathrm)\s*/g, "");
    s = s.replace(/---/g, "—").replace(/--/g, "–").replace(/~/g, " ");
    s = s.replace(/[{}]/g, "");
    return s.replace(/\s+/g, " ").trim();
  }

  function formatAuthors(raw) {
    var names = raw.split(/\s+and\s+/i).map(function (a) {
      a = a.trim();
      var parts = a.split(",");
      if (parts.length >= 2) a = parts.slice(1).join(",").trim() + " " + parts[0].trim();
      return delatex(a);
    }).filter(Boolean);
    if (names.length <= 1) return names.join("");
    return names.slice(0, -1).join(", ") + " e " + names[names.length - 1];
  }

  function doiUrl(doi) {
    doi = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "").replace(/^doi:\s*/i, "");
    return "https://doi.org/" + doi;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- Renderização ----------
  function renderEntry(e) {
    var f = e.fields;
    var title = delatex(f.title);
    var authors = f.author ? formatAuthors(f.author) : "";
    var venue = delatex(f.journal || f.booktitle || f.publisher || f.school || "");
    var details = [];
    if (f.volume) details.push(f.volume + (f.number ? "(" + delatex(f.number) + ")" : ""));
    if (f.pages) details.push(delatex(f.pages));
    var venueLine = venue ? "<em>" + esc(venue) + "</em>" : "";
    if (details.length) venueLine += (venueLine ? ", " : "") + esc(details.join(", "));
    if (f.year) venueLine += (venueLine ? ", " : "") + esc(f.year);
    if (f.note) venueLine += " (" + esc(delatex(f.note)) + ")";

    var link = f.doi ? doiUrl(f.doi) : (f.url || "");
    var titleHtml = link
      ? '<a class="pub-title" href="' + esc(link) + '" target="_blank" rel="noopener">' + esc(title) + "</a>"
      : '<span class="pub-title">' + esc(title) + "</span>";

    var links = [];
    if (f.doi) links.push('<a href="' + esc(doiUrl(f.doi)) + '" target="_blank" rel="noopener">DOI</a>');
    else if (f.url) links.push('<a href="' + esc(f.url) + '" target="_blank" rel="noopener">Link</a>');
    links.push('<button type="button" class="bib-toggle">BibTeX</button>');

    var li = document.createElement("li");
    li.innerHTML = titleHtml +
      (authors ? '<span class="pub-authors">' + esc(authors) + "</span>" : "") +
      (venueLine ? '<span class="pub-venue">' + venueLine + "</span>" : "") +
      '<div class="pub-links">' + links.join("") + "</div>" +
      '<pre class="pub-bibtex" hidden>' + esc(e.raw) + "</pre>";
    li.dataset.search = [title, authors, venue, f.year || ""].join(" ").toLowerCase()
      .normalize("NFD").replace(/[̀-ͯ]/g, "");
    li.querySelector(".bib-toggle").addEventListener("click", function () {
      var pre = li.querySelector(".pub-bibtex");
      pre.hidden = !pre.hidden;
    });
    return li;
  }

  function render(entries) {
    entries.sort(function (a, b) {
      var ya = parseInt(a.fields.year, 10) || 0, yb = parseInt(b.fields.year, 10) || 0;
      if (yb !== ya) return yb - ya;
      return delatex(a.fields.title).localeCompare(delatex(b.fields.title));
    });
    container.innerHTML = "";
    var current = null, list = null;
    entries.forEach(function (e) {
      var y = e.fields.year || "Sem data";
      if (y !== current) {
        current = y;
        var sec = document.createElement("section");
        sec.className = "pub-year";
        sec.innerHTML = "<h2>" + esc(y) + "</h2>";
        list = document.createElement("ol");
        list.className = "pub-list";
        sec.appendChild(list);
        container.appendChild(sec);
      }
      list.appendChild(renderEntry(e));
    });
    updateCount();
  }

  function updateCount() {
    var all = container.querySelectorAll(".pub-list li");
    var visible = 0;
    all.forEach(function (li) { if (!li.hidden) visible++; });
    counter.textContent = visible === all.length
      ? all.length + " publicações"
      : visible + " de " + all.length + " publicações";
  }

  if (search) {
    search.addEventListener("input", function () {
      var q = search.value.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
      container.querySelectorAll(".pub-year").forEach(function (sec) {
        var any = false;
        sec.querySelectorAll("li").forEach(function (li) {
          var show = !q || li.dataset.search.indexOf(q) >= 0;
          li.hidden = !show;
          if (show) any = true;
        });
        sec.hidden = !any;
      });
      updateCount();
    });
  }

  fetch(container.dataset.bib)
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then(function (txt) { render(parseBib(txt)); })
    .catch(function () {
      container.innerHTML = '<p class="notice">Não foi possível carregar as publicações. ' +
        'Baixe o <a href="' + esc(container.dataset.bib) + '">arquivo BibTeX</a>.</p>';
    });

  // Exposto para testes
  window.__lostBib = { parseBib: parseBib, delatex: delatex, formatAuthors: formatAuthors };
})();
