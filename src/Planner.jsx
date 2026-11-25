import React, { useState } from "react";
import PrintPlan from "./PrintPlan";
import { PLAN_STORAGE_KEY, readPlan, validDate, TEAMS, TASKS, STATUSES } from "./lib/plan-storage.js";
import { planningReaches } from "./lib/survey-reaches";
import records from "./lib/survey-data.json";
import {
  ArrowUpRight,
  Check,
  CalendarDays,
  Download,
  Route,
  RotateCcw,
  Printer,
} from "lucide-react";
export default function Planner({ renderSurvey }) {
  const [printOpen, setPrintOpen] = useState(false);
  const [initial] = useState(() => {
    try {
      return readPlan(localStorage);
    } catch {
      return null;
    }
  });
  const [selected, setSelected] = useState(initial?.selected ?? []);
  const [date, setDate] = useState(initial?.date || "");
  const [team, setTeam] = useState(initial?.team || "Бригада № 1");
  const [task, setTask] = useState(
    initial?.task || "Обследование и оценка расчистки",
  );
  const [observations, setObservations] = useState(initial?.observations || {});
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  const chosen = planningReaches.filter((r) => selected.includes(r.id));
  const objectCount = chosen.reduce((sum, reach) => sum + reach.recordIds.length, 0);
  function change(fn) {
    fn();
    setSaved(false);
    setMessage("");
  }
  function toggle(id) {
    change(() =>
      setSelected((s) =>
        s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
      ),
    );
  }
  function addReach(id) {
    if (selected.includes(id)) return;
    setSelected((ids) => ids.includes(id) ? ids : [...ids, id]);
    setSaved(false);
    setMessage(`Участок ${id} добавлен. Укажите дату, чтобы сохранить план.`);
  }
  function updateObservation(id, field, value) {
    change(() => setObservations((observations) => ({
      ...observations,
      [id]: { note: "", status: "", ...observations[id], [field]: value },
    })));
  }
  function submit(e) {
    e.preventDefault();
    if (!chosen.length) {
      setMessage("Выберите хотя бы один участок на карте или в списке.");
      return;
    }
    const plan = { selected, date, team, task, observations };
    try {
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plan));
      setSaved(true);
      setMessage("План сохранён в этом браузере.");
    } catch {
      setMessage("Браузер не разрешил сохранение. Можно скачать план файлом.");
    }
  }
  function download() {
    const data = {
      scenario:
        "Демонстрационный план. Не является заданием на реальные работы.",
      survey: "Лютога · 2 июля 2025",
      date,
      team,
      task,
      route: chosen.map((r) => ({
        section_id: r.id,
        section: r.name,
        objects: r.recordIds.length,
        report_objects: records.filter(({ id }) => r.recordIds.includes(id))
          .map(({ id, lat, lon }) => ({ id, lat, lon })),
        observation: observations[r.id] || null,
      })),
      note: "Участки группируют точки из отчёта. Координаты расчётные. До расчистки необходима экспертная оценка.",
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "RIVER_field_plan.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      {printOpen && (
        <PrintPlan
          plan={{ chosen, date, team, task, objectCount, observations }}
          onClose={() => setPrintOpen(false)}
        />
      )}
      {renderSurvey({ selectedReaches: selected, toggleReach: toggle, addReach })}
      <section id="planner" className="planner survey-planner" aria-labelledby="planner-title">
        <div className="survey-planner-heading">
          <h3 id="planner-title">План выезда</h3>
          <p>Учебный план полевой проверки. Выберите участки на общей карте или в списке. Решение о расчистке принимает специалист по итогам осмотра.</p>
        </div>
        <div className="planner-workspace">
          <div className="reach-panel">
            <div className="panel-title">
              <strong>Участки реки</strong>
              <span>Лютога</span>
            </div>
            <div className="reach-list">
              {planningReaches.map((r) => (
                <button
                  key={r.id}
                  className={
                    "reach-card " + (selected.includes(r.id) ? "selected" : "")
                  }
                  aria-pressed={selected.includes(r.id)}
                  onClick={() => toggle(r.id)}
                >
                  <span className="reach-check">
                    {selected.includes(r.id) ? <Check size={14} /> : r.id}
                  </span>
                  <span>
                    <strong>{r.name}</strong>
                    <small>{r.recordIds.length} объектов · № {r.first}–{r.last}</small>
                  </span>
                </button>
              ))}
            </div>
            <small className="planner-hint">
              Нажмите на участок в списке или на карте. Можно выбрать несколько.
            </small>
            <button
              className="reset-plan"
              onClick={() => change(() => setSelected([]))}
            >
              <RotateCcw size={13} /> Сбросить выбор
            </button>
          </div>
          <form className="trip-form" onSubmit={submit}>
            <div className="panel-title">
              <strong>Полевой выезд</strong>
              <CalendarDays size={18} />
            </div>
            <div className="plan-summary">
              <div>
                <strong>{chosen.length}</strong>
                <span>участков</span>
              </div>
              <div>
                <strong>{objectCount}</strong>
                <span>объектов из отчёта</span>
              </div>
            </div>
            <label className="field-label">
              Дата выезда
              <input
                type="date"
                required
                value={date}
                onChange={(e) => change(() => setDate(e.target.value))}
              />
            </label>
            <label className="field-label">
              Бригада
              <select
                aria-label="Бригада"
                value={team}
                onChange={(e) => change(() => setTeam(e.target.value))}
              >
                {TEAMS.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="field-label">
              Задача
              <select
                aria-label="Задача"
                value={task}
                onChange={(e) => change(() => setTask(e.target.value))}
              >
                {TASKS.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            {chosen.length > 0 && (
              <details className="plan-observations">
                <summary>Заметки по участкам</summary>
                {chosen.map(({ id, name }) => (
                  <fieldset key={id}>
                    <legend>{id} · {name}</legend>
                    <label className="field-label">
                      Статус участка {id}
                      <select value={observations[id]?.status ?? ""}
                        onChange={(e) => updateObservation(id, "status", e.target.value)}>
                        <option value="">Статус не задан</option>
                        {STATUSES.map((value) => <option key={value}>{value}</option>)}
                      </select>
                    </label>
                    <label className="field-label">
                      Заметка участка {id}
                      <textarea value={observations[id]?.note ?? ""} maxLength={600} rows={2}
                        onChange={(e) => updateObservation(id, "note", e.target.value)} />
                    </label>
                  </fieldset>
                ))}
              </details>
            )}
            <div className="route-preview">
              <Route size={16} />
              <span>
                {chosen.length
                  ? chosen.map((r) => r.id).join(" → ")
                  : "Участки не выбраны"}
              </span>
              <small>Порядок в плане</small>
            </div>
            <button type="submit" className="button primary">
              {saved ? (
                <>
                  <Check size={16} /> План сохранён
                </>
              ) : (
                <>
                  Сохранить план <ArrowUpRight size={16} />
                </>
              )}
            </button>
            <button
              type="button"
              className="print-plan-button"
              disabled={!chosen.length || !validDate(date)}
              onClick={() => setPrintOpen(true)}
            >
              <Printer size={16} /> Печатный план / PDF
            </button>
            <button
              type="button"
              className="download-plan"
              disabled={!chosen.length || !validDate(date)}
              onClick={download}
            >
              <Download size={14} /> Скачать план JSON
            </button>
            <p className="plan-feedback" role="status">
              {message}
            </p>
            <small className="planner-hint">
              План хранится только в вашем браузере. Скачайте файл, чтобы
              передать его коллегам.
            </small>
          </form>
        </div>
      </section>
    </>
  );
}
