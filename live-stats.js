/* KnightTrader live stats: fills [data-kt="<field>"] from the public, aggregate-only endpoint. Fails silently (static text stays). */
(function () {
  var URL = "https://knighttrader.tail7aa3c9.ts.net/api/public/stats";
  var PAPER = "paper results, not a guarantee";
  function money(v) { return "$" + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function fmt(k, v) {
    if (v === null || v === undefined || v === "") return null;
    if (k === "mm_week" || k === "mm_month") return money(v) + " (" + PAPER + ")";
    if (k === "mm_basis") return "MM figures are " + PAPER + ".";
    if (k === "medic_status") return v === "ok" ? "All checks passing" : v === "attention" ? "Repairing" : null;
    if (k === "updated_at" || k === "medic_checked_at") { var d = new Date(v); return isNaN(d) ? null : d.toLocaleString(); }
    if (k === "uptime_seconds") { var h = Math.floor(v / 3600); return h >= 24 ? Math.floor(h / 24) + "d " + (h % 24) + "h" : h + "h " + Math.floor((v % 3600) / 60) + "m"; }
    if (typeof v === "number") return v.toLocaleString();
    return String(v);
  }
  function fill(d) {
    var els = document.querySelectorAll("[data-kt]");
    for (var i = 0; i < els.length; i++) { var k = els[i].getAttribute("data-kt"), t = fmt(k, d[k]); if (t !== null) els[i].textContent = t; }
  }
  function load() {
    if (!window.fetch) return;
    fetch(URL, { mode: "cors", credentials: "omit" }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) fill(d); }).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", load); else load();
  setInterval(load, 60000);
})();
