export const TEAMS = ["Бригада № 1", "Бригада № 2", "Исследовательская группа"];
export const TASKS = [
  "Обследование и оценка расчистки",
  "Расчистка согласованных участков",
  "Повторная съёмка и мониторинг",
];
export const STATUSES = [
  "Требует осмотра",
  "Наблюдать в динамике",
  "Передать специалисту",
];
const ids = ["A", "B", "C"];
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
  const observations = {};
  for (const id of ids) {
    const item = value.observations?.[id];
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    observations[id] = {
      note: typeof item.note === "string" ? item.note.slice(0, 600) : "",
      status: STATUSES.includes(item.status) ? item.status : STATUSES[0],
    };
  }
  return {
    selected: Array.isArray(value.selected)
      ? ids.filter((id) => value.selected.includes(id))
      : ["A"],
    date: validDate(value.date) ? value.date : "",
    team: TEAMS.includes(value.team) ? value.team : TEAMS[0],
    task: TASKS.includes(value.task) ? value.task : TASKS[0],
    observations,
  };
}
export function readPlan(storage) {
  try {
    return normalizePlan(JSON.parse(storage.getItem("river-field-plan")));
  } catch {
    return null;
  }
}
