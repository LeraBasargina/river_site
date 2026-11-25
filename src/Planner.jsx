import React, { useRef, useState } from "react";
import PrintPlan from "./PrintPlan";
import { readPlan, removalObjects, validDate, writePlan, TEAMS } from "./lib/plan-storage.js";
import { ArrowUpRight, CalendarDays, Check, Download, Eraser, Printer, X } from "lucide-react";

export default function Planner({ renderSurvey }) {
  const [printPlan, setPrintPlan] = useState(null);
  const printButton = useRef(null);
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
  const canPrint = chosen.length > 0;
  const canExport = canPrint && validDate(date);
  const canClear = Object.keys(decisions).length > 0 || date !== "" || team !== TEAMS[0];

  function closePrintPlan() {
    setPrintPlan(null);
    printButton.current.focus();
  }

  function change(fn) {
    fn();
    setPrintPlan(null);
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
      writePlan(localStorage, { decisions, date, team });
      setSaved(true);
      setMessage("Решения и план сохранены в этом браузере.");
    } catch {
      setMessage("Браузер не разрешил сохранение. Если есть объекты в плане, укажите дату и скачайте файл.");
    }
  }

  function clear() {
    if (!window.confirm("Очистить план? Решения по объектам, заметки, дата и выбор бригады будут сброшены.")) return;
    const empty = { decisions: {}, date: "", team: TEAMS[0] };
    setDecisions(empty.decisions);
    setDate(empty.date);
    setTeam(empty.team);
    setPrintPlan(null);
    setSaved(false);
    try {
      writePlan(localStorage, empty);
      setMessage("План очищен. Можно выбрать объекты на карте заново.");
    } catch {
      setMessage("План на странице очищен. Браузер не обновил сохранённую копию.");
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
            <button ref={printButton} type="button" className="print-plan-button" disabled={!canPrint}
              aria-expanded={Boolean(printPlan)} aria-controls={printPlan ? "print-plan-preview" : undefined} onClick={() => {
                if (printPlan) closePrintPlan();
                else setPrintPlan({ chosen, date, team });
              }}>
              <Printer size={16} /> Печатный план / PDF
            </button>
            <button type="button" className="download-plan" disabled={!canExport} onClick={download}>
              <Download size={14} /> Скачать план JSON
            </button>
            <button type="button" className="clear-plan" disabled={!canClear} onClick={clear}>
              <Eraser size={16} /> Очистить план
            </button>
            <p className="plan-feedback" role="status">{message}</p>
            <small className="planner-hint">
              Для печати и PDF добавьте объект в план. Для JSON также укажите дату выезда.
            </small>
          </form>
        </div>
        {printPlan && <PrintPlan plan={printPlan} onClose={closePrintPlan} />}
      </section>
    </>
  );
}
