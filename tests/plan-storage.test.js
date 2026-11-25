import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PLAN_STORAGE_KEY, readPlan, normalizePlan, validDate, removalObjects, writePlan, TEAMS } from "../src/lib/plan-storage.js";
import { planningReaches, reachForRecord } from "../src/lib/survey-reaches.js";
import { createPlanPdf, makePlanDocument } from "../src/lib/plan-document.js";
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
test("saved decisions use report IDs and accept only known choices", () => {
  const plan = normalizePlan({
    decisions: {
      7: { decision: "remove", note: "x".repeat(900) },
      15: { decision: "remove", note: { bad: true } },
      19: { decision: "keep" },
      20: { decision: "pending", note: "Уточнить доступ" },
      21: { decision: "pending" },
      22: { decision: ["remove"] },
      23: { decision: "remove" },
      C: { decision: "remove" },
    },
    date: "2026-02-30",
    team: {},
  });
  assert.equal(plan.date, "");
  assert.equal(typeof plan.team, "string");
  assert.deepEqual(Object.keys(plan.decisions), ["7", "15", "19", "20"]);
  assert.deepEqual(plan.decisions[7], { decision: "remove", note: "x".repeat(600) });
  assert.equal(plan.decisions[15].note, "");
  assert.deepEqual(plan.decisions[19], { decision: "keep", note: "" });
  assert.deepEqual(plan.decisions[20], { decision: "pending", note: "Уточнить доступ" });
});

test("the removal plan contains only individually selected objects", () => {
  const decisions = {
    7: { decision: "remove", note: "" },
    19: { decision: "keep", note: "" },
    20: { decision: "pending", note: "На проверку" },
    22: { decision: "remove", note: "Проверить доступ к берегу" },
  };
  const chosen = removalObjects(decisions);
  assert.deepEqual(chosen.map(({ id, section_id }) => [id, section_id]), [[7, "A"], [22, "C"]]);
  assert.equal(chosen[1].lat, 46.782232);
  assert.equal(chosen[1].lon, 142.4868631);
  assert.equal(chosen[1].note, "Проверить доступ к берегу");
  assert.deepEqual(removalObjects({ 19: { decision: "keep" } }), []);
});

test("only actual calendar dates survive validation", () => {
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(validDate("2026-02-29"), false);
  assert.equal(validDate("2026-11-06"), true);
  assert.equal(validDate("2026-13-01"), false);
});
test("legacy plans retain logistics without marking any objects for removal", () => {
  const oldPlan = {
    selected: ["A", "C"],
    date: "2026-11-12",
    team: "Бригада № 2",
    task: "Расчистка согласованных участков",
    observations: { A: { note: "Старая заметка" } },
  };
  for (const key of ["river-field-plan:lyutoga-2025-07-02", "river-field-plan"]) {
    const migrated = readPlan({ getItem: (name) => name === key ? JSON.stringify(oldPlan) : null });
    assert.deepEqual(migrated, { date: oldPlan.date, team: oldPlan.team, decisions: {} });
  }
  const current = { date: "", team: oldPlan.team, decisions: { 19: { decision: "keep", note: "" } } };
  assert.deepEqual(readPlan({ getItem: (key) => key === PLAN_STORAGE_KEY ? JSON.stringify(current) : null }), current);
});

test("planning sections cover every report point exactly once", () => {
  const records = JSON.parse(readFileSync(new URL("../src/lib/survey-data.json", import.meta.url), "utf8"));
  assert.deepEqual(planningReaches.flatMap(({ recordIds }) => recordIds), records.map(({ id }) => id));
  for (const reach of planningReaches) assert.equal(reachForRecord(reach.markerId), reach);
});

test("saving an empty removal plan prevents old decisions or logistics from returning", () => {
  const previousKey = "river-field-plan:lyutoga-2025-07-02";
  const previousValue = JSON.stringify({ date: "2026-12-01", team: TEAMS[1] });
  const values = new Map([
    [previousKey, previousValue],
    [PLAN_STORAGE_KEY, JSON.stringify({ date: "2026-12-02", team: TEAMS[1], decisions: { 22: { decision: "remove", note: "Берег" } } })],
    ["river-theme", "dark"],
  ]);
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const empty = { decisions: {}, date: "", team: TEAMS[0] };
  writePlan(storage, empty);
  assert.deepEqual(readPlan(storage), empty);
  assert.equal(values.get(previousKey), previousValue);
  assert.equal(values.get("river-theme"), "dark");
});

test("generating a PDF leaves the print preview data unchanged", async () => {
  const plan = makePlanDocument({
    chosen: removalObjects({ 22: { decision: "remove", note: "Проверить доступ к берегу" } }),
    date: "",
    team: TEAMS[0],
  });
  const before = structuredClone(plan);
  const content = await createPlanPdf(plan).getBuffer();
  assert.equal(content.subarray(0, 5).toString(), "%PDF-");
  assert.deepEqual(plan, before);
});
