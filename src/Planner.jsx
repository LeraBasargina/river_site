import React, { useState, useEffect } from "react";
import PrintPlan from "./PrintPlan";
import { readPlan, validDate, TEAMS, TASKS } from "./lib/plan-storage.js";
import {
  ArrowUpRight,
  Check,
  CalendarDays,
  Download,
  MapPin,
  Route,
  RotateCcw,
  Printer,
} from "lucide-react";
const reaches = [
  {
    id: "A",
    name: "Верхний участок",
    km: "0,8",
    jams: 2,
    priority: "Высокий",
    path: "M340 -20 C80 40 490 140 260 220",
    x: 260,
    y: 135,
  },
  {
    id: "B",
    name: "Излучина",
    km: "1,2",
    jams: 4,
    priority: "Высокий",
    path: "M260 220 C60 310 530 320 335 405",
    x: 280,
    y: 310,
  },
  {
    id: "C",
    name: "Нижний участок",
    km: "0,6",
    jams: 1,
    priority: "Плановый",
    path: "M335 405 C100 490 215 520 170 620",
    x: 220,
    y: 505,
  },
];
export default function Planner({ request }) {
  const [printOpen, setPrintOpen] = useState(false);
  const [initial] = useState(() => {
    try {
      return readPlan(localStorage);
    } catch {
      return null;
    }
  });
  const [selected, setSelected] = useState(initial?.selected || ["A"]);
  const [date, setDate] = useState(initial?.date || "");
  const [team, setTeam] = useState(initial?.team || "Бригада № 1");
  const [task, setTask] = useState(
    initial?.task || "Обследование и оценка расчистки",
  );
  const [filter, setFilter] = useState("Все участки");
  const [observations, setObservations] = useState(initial?.observations || {});
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!request || !["A", "B", "C"].includes(request.sectionId)) return;
    setSelected((s) =>
      s.includes(request.sectionId) ? s : [...s, request.sectionId],
    );
    setObservations((s) => ({
      ...s,
      [request.sectionId]: { note: request.note, status: request.status },
    }));
    setSaved(false);
    setMessage(
      "Участок " +
        request.sectionId +
        " добавлен из обследования. Сохраните план после выбора даты.",
    );
  }, [request]);
  const chosen = reaches.filter((r) => selected.includes(r.id));
  const visible = reaches.filter(
    (r) => filter === "Все участки" || r.priority === "Высокий",
  );
  const sum = chosen
    .reduce((s, r) => s + Number(r.km.replace(",", ".")), 0)
    .toFixed(1)
    .replace(".", ",");
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
  function submit(e) {
    e.preventDefault();
    if (!chosen.length) {
      setMessage("Выберите хотя бы один участок на схеме или в списке.");
      return;
    }
    const plan = { selected, date, team, task, observations };
    try {
      localStorage.setItem("river-field-plan", JSON.stringify(plan));
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
      date,
      team,
      task,
      route: chosen.map((r) => ({
        section: r.name,
        length_km: r.km,
        objects: r.jams,
        priority: r.priority,
        observation: observations[r.id] || null,
      })),
      note: "Приоритеты и протяжённость условные. До расчистки необходима экспертная оценка.",
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
          plan={{ chosen, date, team, task, sum, observations }}
          onClose={() => setPrintOpen(false)}
        />
      )}
      <section id="planner" className="planner section">
        <div className="section-kicker">
          <span>04 / ОТ НАБЛЮДЕНИЯ К ДЕЙСТВИЮ</span>
          <span className="demo-badge">КОНЦЕПЦИЯ РАЗВИТИЯ</span>
        </div>
        <div className="section-heading">
          <h2>
            Выберите участок.
            <br />
            <span>Спланируйте выезд.</span>
          </h2>
          <p>
            Соберите маршрут обследования или расчистки.
            <br />
            Попробуйте роль координатора полевой бригады.
          </p>
        </div>
        <div className="planner-notice">
          <MapPin size={17} />
          <span>
            Интерактивный сценарий на условных данных. Выезд не отправляется
            бригаде. Необходимость расчистки определяет специалист.
          </span>
        </div>
        <div className="planner-workspace">
          <div className="reach-panel">
            <div className="panel-title">
              <strong>Участки реки</strong>
              <span>01 — 03</span>
            </div>
            <label className="field-label">
              Показать
              <select
                aria-label="Показать"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option>Все участки</option>
                <option>Высокий приоритет</option>
              </select>
            </label>
            <div className="reach-list">
              {visible.map((r) => (
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
                    <small>
                      {r.km} км · {r.jams} завала
                    </small>
                    <em
                      className={
                        r.priority === "Высокий" ? "priority high" : "priority"
                      }
                    >
                      {r.priority} приоритет
                    </em>
                  </span>
                </button>
              ))}
            </div>
            <small className="planner-hint">
              Нажмите на участок в списке или на схеме. Можно выбрать несколько.
            </small>
            <button
              className="reset-plan"
              onClick={() => change(() => setSelected([]))}
            >
              <RotateCcw size={13} /> Сбросить выбор
            </button>
          </div>
          <div className="reach-map">
            <svg
              viewBox="0 0 560 600"
              preserveAspectRatio="none"
              aria-label="Выбор трёх участков реки"
            >
              <defs>
                <pattern
                  id="plan-grid"
                  width="35"
                  height="35"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M35 0H0V35"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity=".1"
                  />
                </pattern>
              </defs>
              <rect width="560" height="600" fill="url(#plan-grid)" />
              {reaches.map((r) => (
                <g
                  key={r.id}
                  className={
                    "reach-shape " + (selected.includes(r.id) ? "selected" : "")
                  }
                >
                  <path d={r.path} className="river-bank" />
                  <path d={r.path} className="river-water" />
                  <path d={r.path} className="river-center" />
                  <path
                    d={r.path}
                    className="river-hit"
                    role="button"
                    aria-label={"Выбрать участок " + r.id}
                    aria-pressed={selected.includes(r.id)}
                    tabIndex="0"
                    onClick={() => toggle(r.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggle(r.id);
                      }
                    }}
                  />
                </g>
              ))}
            </svg>
            <div className="plan-map-label">
              РЕЧНОЙ МАРШРУТ <span>N ↑</span>
            </div>
            {reaches.map((r) => (
              <button
                key={r.id}
                className={
                  "reach-label " + (selected.includes(r.id) ? "selected" : "")
                }
                style={{
                  left: (r.x / 560) * 100 + "%",
                  top: (r.y / 600) * 100 + "%",
                }}
                onClick={() => toggle(r.id)}
                aria-label={"Выбрать " + r.name}
              >
                <b>{r.id}</b>
                <span>{r.name}</span>
              </button>
            ))}
            <span className="plan-map-caption">
              СХЕМА УСЛОВНАЯ · НЕ ДЛЯ НАВИГАЦИИ
            </span>
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
                <strong>{sum}</strong>
                <span>км по схеме</span>
              </div>
              <div>
                <strong>{chosen.reduce((s, r) => s + r.jams, 0)}</strong>
                <span>завалов</span>
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
            {chosen.some((r) => observations[r.id]) && (
              <div className="plan-observations">
                {chosen
                  .filter((r) => observations[r.id])
                  .map((r) => (
                    <div key={r.id}>
                      <strong>
                        Участок {r.id} · {observations[r.id].status}
                      </strong>
                      {observations[r.id].note && (
                        <p>{observations[r.id].note}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}
            <div className="route-preview">
              <Route size={16} />
              <span>
                {chosen.length
                  ? chosen.map((r) => r.id).join(" → ")
                  : "Маршрут не выбран"}
              </span>
              <small>По направлению течения</small>
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
