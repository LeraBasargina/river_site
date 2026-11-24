export const showDuration = 90;
export const showFadeDuration = 0.75;

export const showScenes = [
  { at: 0, kind: "intro", title: "Заставка", videoFrom: 8.6 },
  { at: 8, kind: "flight", title: "Обследование" },
  { at: 22, kind: "detection", title: "Обнаружение", videoFrom: 4.5 },
  { at: 42, kind: "report", title: "Объекты отчёта", recordId: 7 },
  { at: 53, kind: "report", title: "Объекты отчёта", recordId: 19 },
  { at: 65, kind: "plan", title: "План осмотра" },
  { at: 80, kind: "outro", title: "Итог" },
];

export function sceneAt(time) {
  return showScenes.findLast(({ at }) => time >= at);
}
