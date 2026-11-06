/*
 * Closed-trade journal rows for the published Muse desk.
 *
 * The compiled page delegates here. This file is the source of the row
 * mapping. It reads groups.journal.closed[] and does not invent coins,
 * results, R, prices, reasons, or timestamps.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.KnightTraderJournal = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  var TIMESTAMP_FIELDS = ["ts_ny", "ts", "closed_ts_ny", "exit_ts_ny", "time_ny", "closed_at"];

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function list(value) {
    return Array.isArray(value) ? value : [];
  }

  function text(value) {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "number") {
      if (!Number.isFinite(value)) return "—";
      return trimNumber(value);
    }
    if (typeof value === "string") return value;
    return "—";
  }

  function trimNumber(value) {
    var raw = value.toFixed(8).replace(/\.?0+$/, "");
    return raw === "-0" ? "0" : raw;
  }

  function present(value) {
    return !(value === null || value === undefined || value === "");
  }

  function readTimestamp(row) {
    for (var i = 0; i < TIMESTAMP_FIELDS.length; i += 1) {
      var field = TIMESTAMP_FIELDS[i];
      if (!Object.prototype.hasOwnProperty.call(row, field)) continue;
      if (!present(row[field])) continue;
      return { field: field, value: row[field] };
    }
    return null;
  }

  function formatClock(date) {
    var day = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
    var clock = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
    return day + ", " + clock + " ET";
  }

  function formatTimestamp(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      var fromNumber = new Date(value);
      if (!Number.isNaN(fromNumber.getTime())) return formatClock(fromNumber);
    }
    if (typeof value === "string") {
      var fromString = new Date(value);
      if (!Number.isNaN(fromString.getTime())) return formatClock(fromString);
      return value;
    }
    return null;
  }

  function describeJournal(journal) {
    var closed = list(journal && journal.closed);
    var fills = list(journal && journal.recent_fills);
    var cashflows = list(journal && journal.cashflows);
    var rows = [];
    for (var i = 0; i < closed.length; i += 1) {
      var row = closed[i];
      if (!isObject(row)) continue;
      var stamp = readTimestamp(row);
      var timeText = stamp ? formatTimestamp(stamp.value) : null;
      rows.push({
        key: String(i) + "-" + text(row.coin) + "-" + text(row.side),
        coin: text(row.coin),
        side: text(row.side),
        tf: present(row.tf) ? text(row.tf) : "",
        result: text(row.result),
        rText: text(row.r),
        entryText: text(row.entry),
        exitText: text(row.exit),
        reason: text(row.reason),
        timeField: stamp ? stamp.field : null,
        timeText: timeText || "no close time published",
      });
    }
    return {
      counts: {
        closed: closed.length,
        fills: fills.length,
        cashflows: cashflows.length,
      },
      rows: rows,
      emptyAll: closed.length === 0 && fills.length === 0 && cashflows.length === 0,
      stale: !!(journal && journal.fresh === false),
    };
  }

  return { describeJournal: describeJournal };
});
