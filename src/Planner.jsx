import React, { useState } from "react";
import PrintPlan from "./PrintPlan";
import { PLAN_STORAGE_KEY, readPlan, removalObjects, validDate, TEAMS } from "./lib/plan-storage.js";
import { ArrowUpRight, CalendarDays, Check, Download, Printer, X } from "lucide-react";

export default function Planner({ renderSurvey }) {
  const [printOpen, setPrintOpen] = useState(false);
  const [initial] = useState(() => {
    try {
      return readPlan(localStorage);
    } catch {
      return null;
    }
  });
  const [decisions, setDecisions] = useState(initial?.decisions ?? {});
  const [date, setDate] = useState(initial?.date ?? "");
  const [team, setTeam] = useState(initial?.team ?? TEAMS[0]);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const chosen = removalObjects(decisions);
  const verifiedCount = Object.values(decisions).filter(({ decision }) => decision !== "pending").length;
  const canExport = chosen.length > 0 && validDate(date);
  const plan = { chosen, date, team };

  function change(fn) {
    fn();
    setSaved(false);
    setMessage("");
  }

  function decide(id, decision) {
    change(() => setDecisions((current) => {
      const next = { ...current };
      const note = current[id]?.note ?? "";
      if (decision === "pending" && !note) delete next[id];
      else next[id] = { decision, note };
      return next;
    }));
  }

  function updateNote(id, note) {
    change(() => setDecisions((current) => ({
      ...current,
      [id]: { ...current[id], note },
    })));
  }

  function submit(event) {
    event.preventDefault();
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({ decisions, date, team }));
      setSaved(true);
      setMessage("Решения и план сохранены в этом браузере.");
    } catch {
      setMessage("Браузер не разрешил сохранение. Если есть объекты в плане, укажите дату и скачайте файл.");
    }
  }

  function download() {
    const data = {
      scenario: "Учебный план устранения завалов",
      survey: "Лютога · 2 июля 2025",
      date,
      team,
      objects: chosen,
      note: "В план включены объекты, выбранные при проверке. Координаты расчётные.",
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "RIVER_removal_plan.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      {printOpen && <PrintPlan plan={plan} onClose={() => setPrintOpen(false)} />}
      {renderSurvey({ decisions, decide })}
      <section id="planner" className="planner survey-planner" aria-labelledby="planner-title">
        <div className="survey-planner-heading">
          <h3 id="planner-title">План устранения завалов</h3>
          <p>Учебный план по итогам проверки. В него входят завалы, которые специалист выбрал для устранения.</p>
        </div>
        <div className="planner-workspace">
          <div className="plan-object-panel">
            <div className="panel-title"><strong>Объекты в плане</strong><span>Лютога</span></div>
            {chosen.length ? (
              <ul className="plan-object-list">
                {chosen.map((record) => (
                  <li key={record.id} className="plan-object">
                    <div className="plan-object-heading">
                      <strong>Объект №{record.id}</strong>
                      <button type="button" aria-label={`Убрать объект №${record.id} из плана`}
                        title="Убрать из плана и вернуть на проверку" onClick={() => decide(record.id, "pending")}>
                        <X size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <span>{record.category} · участок {record.section_id}</span>
                    <small>{record.lat.toFixed(7)}, {record.lon.toFixed(7)}</small>
                    <label className="field-label">
                      Заметка к объекту №{record.id}
                      <textarea value={record.note} maxLength={600} rows={2}
                        onChange={(event) => updateNote(record.id, event.target.value)} />
                    </label>
                  </li>
                ))}
              </ul>
            ) : <p className="plan-empty">Пока пусто. Откройте объект на карте и нажмите «Объект в план».</p>}
            <a className="plan-map-link" href="#survey-map-panel">К карте объектов <ArrowUpRight size={15} /></a>
          </div>
          <form className="trip-form" onSubmit={submit}>
            <div className="panel-title"><strong>Полевой выезд</strong><CalendarDays size={18} /></div>
            <div className="plan-summary">
              <div><strong>{chosen.length}</strong><span>в плане устранения</span></div>
              <div><strong>{verifiedCount}</strong><span>проверено объектов</span></div>
            </div>
            <label className="field-label">
              Дата выезда
              <input type="date" value={date} onChange={(event) => change(() => setDate(event.target.value))} />
            </label>
            <label className="field-label">
              Бригада
              <select value={team} onChange={(event) => change(() => setTeam(event.target.value))}>
                {TEAMS.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <button type="submit" className="button primary">
              {saved ? <><Check size={16} /> План сохранён</> : <>Сохранить план <ArrowUpRight size={16} /></>}
            </button>
            <button type="button" className="print-plan-button" disabled={!canExport} onClick={() => setPrintOpen(true)}>
              <Printer size={16} /> Печатный план / PDF
            </button>
            <button type="button" className="download-plan" disabled={!canExport} onClick={download}>
              <Download size={14} /> Скачать план JSON
            </button>
            <p className="plan-feedback" role="status">{message}</p>
            <small className="planner-hint">
              Решения можно сохранить без даты. Для печати или скачивания добавьте объект в план и укажите дату выезда.
            </small>
          </form>
        </div>
      </section>
    </>
  );
}
