import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";
import { validDate } from "./plan-storage.js";

pdfMake.addVirtualFileSystem(pdfFonts);

export function makePlanDocument({ date, team, chosen }) {
  return {
    title: "План устранения завалов",
    label: "ПОЛЕВОЙ ПЛАН / УЧЕБНЫЙ СЦЕНАРИЙ",
    source: "План по материалам обследования Лютоги от 2 июля 2025 года. Включены объекты, выбранные специалистом при проверке.",
    details: [
      { label: "Дата выезда", value: validDate(date) ? date.split("-").reverse().join(".") : "Не назначена" },
      { label: "Бригада", value: team },
      { label: "Задача", value: "Устранение выбранных древесных завалов" },
    ],
    objects: chosen.map(({ id, category, section_id, section, lat, lon, note }) => ({
      id,
      title: `Объект №${id} · ${category}`,
      section: `Участок ${section_id} · ${section}`,
      coordinates: `Расчётные координаты · ${lat.toFixed(7)}, ${lon.toFixed(7)}`,
      note,
    })),
    checklist: [
      "Согласовать необходимость и объём работ со специалистом.",
      "Уточнить реальные координаты, подъезды и доступ к берегу.",
      "Проверить условия безопасности и состав оборудования.",
    ],
    footer: "Сформировано в планировщике RIVER. Перед полевыми работами подтвердите координаты объектов и условия доступа.",
  };
}

export function createPlanPdf(plan) {
  return pdfMake.createPdf({
    info: { title: plan.title },
    pageSize: "A4",
    pageMargins: [43, 43, 43, 43],
    defaultStyle: { font: "Roboto", fontSize: 10, color: "#183c4b", lineHeight: 1.25 },
    styles: {
      title: { fontSize: 22, bold: true, margin: [0, 12, 0, 8] },
      heading: { fontSize: 14, bold: true, margin: [0, 13, 0, 7] },
      caption: { fontSize: 9, color: "#425c6a" },
    },
    content: [
      { text: `RIVER  ·  ${plan.label}`, style: "caption" },
      { text: plan.title, style: "title" },
      { text: plan.source, margin: [0, 0, 0, 13] },
      ...plan.details.map(({ label, value }) => ({
        text: [{ text: `${label} · `, bold: true }, value],
      })),
      { text: `Объекты в плане · ${plan.objects.length}`, style: "heading", headlineLevel: 1 },
      ...plan.objects.map((object) => ({
        unbreakable: true,
        margin: [0, 0, 0, 9],
        stack: [
          { text: object.title, bold: true },
          object.section,
          object.coordinates,
          ...(object.note ? [{ text: [{ text: "Заметка · ", bold: true }, object.note] }] : []),
        ],
      })),
      { text: "Перед выездом", style: "heading", headlineLevel: 1 },
      { ul: [...plan.checklist], margin: [0, 0, 0, 12] },
      { text: plan.footer, style: "caption" },
    ],
  });
}
