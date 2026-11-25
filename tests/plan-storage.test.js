import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PLAN_STORAGE_KEY, readPlan, normalizePlan, validDate } from "../src/lib/plan-storage.js";
import { planningReaches, reachForRecord } from "../src/lib/survey-reaches.js";
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
  assert.deepEqual(normalizePlan({ selected: 4 }).selected, []);
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
test("legacy plans retain logistics without reassigning fictitious sections or notes", () => {
  const oldPlan = {
    selected: ["A", "C"],
    date: "2026-11-12",
    team: "Бригада № 2",
    task: "Расчистка согласованных участков",
    observations: { A: { note: "Старая заметка" } },
  };
  const migrated = readPlan({ getItem: (key) => key === "river-field-plan" ? JSON.stringify(oldPlan) : null });
  assert.deepEqual(migrated, { ...oldPlan, selected: [], observations: {} });
  const current = { ...oldPlan, selected: ["B"], observations: { B: { note: "Новая заметка", status: "" } } };
  assert.deepEqual(readPlan({ getItem: (key) => key === PLAN_STORAGE_KEY ? JSON.stringify(current) : null }), current);
});
test("planning sections cover every report point exactly once", () => {
  const records = JSON.parse(readFileSync(new URL("../src/lib/survey-data.json", import.meta.url), "utf8"));
  assert.deepEqual(planningReaches.flatMap(({ recordIds }) => recordIds), records.map(({ id }) => id));
  for (const reach of planningReaches) assert.equal(reachForRecord(reach.markerId), reach);
});
