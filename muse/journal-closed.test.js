const assert = require("node:assert/strict");
const test = require("node:test");
const journal = require("./journal-closed.js");

const liveClosed = [
  {
    coin: "XTEN",
    side: "long",
    tf: "15m",
    result: "LOSER",
    r: -1.1662,
    entry: 0.245572,
    exit: 0.2438,
    reason: "delayed_reconcile_recovery",
    ts_ny: null,
  },
  {
    coin: "ICP",
    side: "short",
    tf: "15m",
    result: "LOSER",
    r: -1.0812,
    entry: 2.4088,
    exit: 2.4409,
    reason: "exchange_flat",
    ts_ny: null,
  },
];

test("live closed rows keep feed fields and do not invent a clock time", () => {
  const view = journal.describeJournal({
    fresh: false,
    closed: liveClosed,
    recent_fills: [
      {
        kind: "closed",
        coin: "XTEN",
        side: "long",
        r: -1.1662,
        ts_ny: "2026-11-05T19:38:07.920875-05:00",
      },
    ],
    cashflows: [],
  });
  assert.equal(view.counts.closed, 2);
  assert.equal(view.counts.fills, 1);
  assert.equal(view.stale, true);
  assert.equal(view.rows.length, 2);
  assert.deepEqual(
    view.rows.map((row) => [row.coin, row.side, row.result, row.rText, row.entryText, row.exitText, row.reason, row.timeText]),
    [
      ["XTEN", "long", "LOSER", "-1.1662", "0.245572", "0.2438", "delayed_reconcile_recovery", "no close time published"],
      ["ICP", "short", "LOSER", "-1.0812", "2.4088", "2.4409", "exchange_flat", "no close time published"],
    ]
  );
  const packed = JSON.stringify(view);
  assert.equal(packed.includes("6:12:31"), false);
  assert.equal(packed.includes("7:39:15"), false);
  assert.equal(packed.includes("7:38:07"), false);
});

test("a published timestamp is formatted in ET and other coins are not rewritten", () => {
  const view = journal.describeJournal({
    fresh: true,
    closed: [
      {
        coin: "ZZZ",
        side: "short",
        tf: "5m",
        result: "WINNER",
        r: 1.5,
        entry: 10,
        exit: 9,
        reason: "target",
        ts_ny: "2026-11-05T18:12:31-05:00",
      },
    ],
    recent_fills: [],
    cashflows: [],
  });
  assert.equal(view.stale, false);
  assert.equal(view.rows[0].timeField, "ts_ny");
  assert.equal(view.rows[0].timeText, "Nov 5, 2026, 6:12:31 PM ET");
  assert.equal(view.rows[0].coin, "ZZZ");
  assert.equal(JSON.stringify(view).includes("XTEN"), false);
});

test("empty journal has no rows and does not mark itself fresh", () => {
  const view = journal.describeJournal({
    fresh: false,
    closed: [],
    recent_fills: [],
    cashflows: [],
  });
  assert.equal(view.emptyAll, true);
  assert.deepEqual(view.rows, []);
  assert.equal(view.stale, true);
  assert.deepEqual(view.counts, { closed: 0, fills: 0, cashflows: 0 });
});

test("missing arrays and a fresh empty close list stay empty", () => {
  const view = journal.describeJournal({ fresh: true });
  assert.equal(view.emptyAll, true);
  assert.equal(view.stale, false);
  assert.deepEqual(view.rows, []);
});
