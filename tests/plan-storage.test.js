import test from "node:test";
import assert from "node:assert/strict";
import { readPlan, normalizePlan, validDate } from "../src/lib/plan-storage.js";
test("invalid and inaccessible local storage do not break startup", () => {
  for (const raw of ["{", "null", "42", "[]", '"bad"'])
    assert.equal(readPlan({ getItem: () => raw }), null);
  assert.equal(
    readPlan({
      getItem: () => {
        throw Error("blocked");
      },
    }),
    null,
  );
});
test("saved selections are filtered, ordered and deduplicated, including empty plans", () => {
  assert.deepEqual(
    normalizePlan({ selected: ["C", "A", "C", "unknown"] }).selected,
    ["A", "C"],
  );
  assert.deepEqual(normalizePlan({ selected: [] }).selected, []);
  assert.deepEqual(normalizePlan({ selected: 4 }).selected, ["A"]);
});
test("invalid field and note types are replaced safely", () => {
  const plan = normalizePlan({
    date: "2026-02-30",
    team: {},
    task: 42,
    observations: {
      A: { note: { bad: true }, status: {} },
      B: { note: "x".repeat(900), status: "Передать специалисту" },
      C: [],
    },
  });
  assert.equal(plan.date, "");
  assert.equal(typeof plan.team, "string");
  assert.equal(typeof plan.task, "string");
  assert.equal(plan.observations.A.note, "");
  assert.equal(plan.observations.B.note.length, 600);
  assert.equal(plan.observations.B.status, "Передать специалисту");
  assert.equal(plan.observations.C, undefined);
});
test("only actual calendar dates survive validation", () => {
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(validDate("2026-02-29"), false);
  assert.equal(validDate("2026-11-06"), true);
  assert.equal(validDate("2026-13-01"), false);
});
