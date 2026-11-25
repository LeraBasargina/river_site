import records from "./survey-data.json" with { type: "json" };
import { reachForRecord } from "./survey-reaches.js";

export const PLAN_STORAGE_KEY = "river-removal-plan:lyutoga-2025-07-02";
const legacyKeys = ["river-field-plan:lyutoga-2025-07-02", "river-field-plan"];

export const TEAMS = ["Бригада № 1", "Бригада № 2", "Исследовательская группа"];
export const STATUSES = [
  "Требует осмотра",
  "Наблюдать в динамике",
  "Передать специалисту",
];
export const DECISION_LABELS = {
  pending: "На проверке",
  remove: "В плане устранения",
  keep: "Оставить",
};

export function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(value + "T12:00:00Z");
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function normalizePlan(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const decisions = {};
  for (const { id } of records) {
    const item = value.decisions?.[id];
    if (typeof item?.decision !== "string" || !Object.hasOwn(DECISION_LABELS, item.decision)) continue;
    const note = typeof item.note === "string" ? item.note.slice(0, 600) : "";
    if (item.decision !== "pending" || note) decisions[id] = { decision: item.decision, note };
  }
  return {
    decisions,
    date: validDate(value.date) ? value.date : "",
    team: TEAMS.includes(value.team) ? value.team : TEAMS[0],
  };
}

export function readPlan(storage) {
  try {
    const saved = storage.getItem(PLAN_STORAGE_KEY);
    if (saved !== null) return normalizePlan(JSON.parse(saved));
    for (const key of legacyKeys) {
      const previous = normalizePlan(JSON.parse(storage.getItem(key)));
      if (previous) return { ...previous, decisions: {} };
    }
    return null;
  } catch {
    return null;
  }
}

export function writePlan(storage, plan) {
  storage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
}

export function removalObjects(decisions) {
  return records.filter(({ id }) => decisions[id]?.decision === "remove")
    .map(({ id, lat, lon, category }) => {
      const reach = reachForRecord(id);
      return {
        id,
        category,
        lat,
        lon,
        section_id: reach.id,
        section: reach.name,
        note: decisions[id].note,
      };
    });
}
