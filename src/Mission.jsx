import { STATUSES } from "./lib/plan-storage.js";
import React, { useRef, useState, useEffect } from "react";
import {
  ArrowUpRight,
  Check,
  MapPin,
  Play,
  Pause,
  ScanLine,
  ClipboardList,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
const checkpoints = [
  {
    id: "A",
    time: 5,
    title: "Начало облёта",
    text: "Посмотрите, как маска выделяет древесину на береговой линии.",
  },
  {
    id: "B",
    time: 24,
    title: "Обзор излучины",
    text: "Смена ракурса показывает, почему наблюдения нужно связывать между кадрами.",
  },
  {
    id: "C",
    time: 43,
    title: "Продолжение маршрута",
    text: "Оцените результат на следующих кадрах обследования.",
  },
];
const stamp = (t) =>
  `${Math.floor(t / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(t % 60)
    .toString()
    .padStart(2, "0")}`;
export default function Mission({ onPlan }) {
  const [expanded, setExpanded] = useState(false);
  const section = useRef(null);
  const [tab, setTab] = useState("compare"),
    [split, setSplit] = useState(50),
    [mode, setMode] = useState("segmentation"),
    [index, setIndex] = useState(0),
    [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [drafts, setDrafts] = useState({}),
    [error, setError] = useState("");
  const video = useRef(null),
    target = useRef(0);
  const point = checkpoints[index];
  const note = drafts[point.id]?.note || "";
  const status = drafts[point.id]?.status || "Требует осмотра";
  function setNote(note) {
    setDrafts((d) => ({ ...d, [point.id]: { ...d[point.id], note } }));
  }
  function setStatus(status) {
    setDrafts((d) => ({ ...d, [point.id]: { ...d[point.id], status } }));
  }
  useEffect(() => {
    if (!expanded) return;
    const previous = document.activeElement;
    const scrollY = window.scrollY;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const nodes = [
      ...document.querySelectorAll("header,footer,main > *"),
    ].filter((el) => el !== section.current && !section.current.contains(el));
    const previousInert = nodes.map((el) => [el, el.inert]);
    nodes.forEach((el) => (el.inert = true));
    const focusables = () =>
      [
        ...section.current.querySelectorAll(
          'button,a,input,textarea,select,[tabindex="0"]',
        ),
      ].filter((el) => !el.disabled && el.getClientRects().length);
    const close = section.current.querySelector(".expand-mission");
    close?.focus();
    const handler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setExpanded(false);
      }
      if (e.key === "Tab") {
        const list = focusables();
        const first = list[0],
          last = list.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = oldOverflow;
      previousInert.forEach(([el, value]) => (el.inert = value));
      window.scrollTo(0, scrollY);
      previous?.focus({ preventScroll: true });
    };
  }, [expanded]);
  function jump(i) {
    setIndex(i);
    target.current = checkpoints[i].time;
    setTime(target.current);
    setTab("video");
    if (video.current) video.current.currentTime = target.current;
  }
  function update(e) {
    const t = e.currentTarget.currentTime;
    setTime(t);
    let n = 0;
    checkpoints.forEach((p, i) => {
      if (t >= p.time) n = i;
    });
    setIndex(n);
  }
  function changeMode(m) {
    target.current = video.current?.currentTime || time;
    setPlaying(false);
    setMode(m);
  }
  function addPlan() {
    setExpanded(false);
    onPlan({ sectionId: point.id, note, status, nonce: Date.now() });
    requestAnimationFrame(() =>
      document.getElementById("planner").scrollIntoView({
        behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      }),
    );
  }
  return (
    <section
      ref={section}
      id="video"
      className={"mission section " + (expanded ? "mission-expanded" : "")}
      role={expanded ? "dialog" : undefined}
      aria-modal={expanded ? true : undefined}
      aria-label={expanded ? "Демонстрация обследования" : undefined}
    >
      <div className="mission-expand-bar">
        <span>
          {expanded
            ? "ДЕМОНСТРАЦИЯ ОБСЛЕДОВАНИЯ · ESC — ВЫХОД"
            : "ПРОСТРАНСТВО ДЛЯ ПРЕЗЕНТАЦИИ"}
        </span>
        <button
          className="expand-mission"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}{" "}
          {expanded ? "Свернуть демонстрацию" : "Развернуть демонстрацию"}
        </button>
      </div>
      <div className="section-kicker">ОДНО ОБСЛЕДОВАНИЕ / ОТ КАДРА К ПЛАНУ</div>
      <div className="section-heading">
        <h2>
          Увидеть своими глазами.
          <br />
          <span>Решить, что делать дальше.</span>
        </h2>
        <p>
          Реальная съёмка и результаты модели.
          <br />
          Исследуйте материалы и соберите учебный план выезда.
        </p>
      </div>
      <div className="mission-flow">
        <span>
          <b>01</b> Сравните кадр
        </span>
        <ChevronRight size={14} />
        <span>
          <b>02</b> Посмотрите облёт
        </span>
        <ChevronRight size={14} />
        <span>
          <b>03</b> Запланируйте осмотр
        </span>
      </div>
      <div className="mission-workspace">
        <div className="mission-main">
          <div
            className="mission-tabs"
            role="tablist"
            aria-label="Материалы обследования"
          >
            {[
              ["compare", "До / после"],
              ["video", "Видео и маршрут"],
              ["passport", "Паспорт наблюдения"],
            ].map(([id, title]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => {
                  if (video.current) {
                    target.current = video.current.currentTime;
                    video.current.pause();
                  }
                  setPlaying(false);
                  setTab(id);
                }}
              >
                {title}
              </button>
            ))}
          </div>
          {tab === "compare" ? (
            <div className="compare-pane">
              <div
                className="image-compare"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const r = e.currentTarget.getBoundingClientRect();
                  setSplit(
                    Math.round(
                      Math.max(
                        0,
                        Math.min(100, ((e.clientX - r.left) / r.width) * 100),
                      ),
                    ),
                  );
                }}
                onPointerMove={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    const r = e.currentTarget.getBoundingClientRect();
                    setSplit(
                      Math.round(
                        Math.max(
                          0,
                          Math.min(100, ((e.clientX - r.left) / r.width) * 100),
                        ),
                      ),
                    );
                  }
                }}
                onPointerUp={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId))
                    e.currentTarget.releasePointerCapture(e.pointerId);
                }}
              >
                <img
                  src="/media/survey-original.jpg"
                  alt="Исходная аэросъёмка: древесина у берега реки"
                />
                <img
                  className="compare-overlay"
                  src="/media/survey-segmentation.jpg"
                  alt="Та же сцена с контурами древесных скоплений"
                  style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
                />
                <div className="compare-divider" style={{ left: split + "%" }}>
                  <span>↔</span>
                </div>
                <div className="compare-labels">
                  <span>СЕГМЕНТАЦИЯ</span>
                  <span>ИСХОДНЫЙ КАДР</span>
                </div>
              </div>
              <label className="compare-slider">
                Двигайте ползунок, чтобы сравнить
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  aria-label="Доля результата сегментации"
                />
              </label>
              <p className="mission-footnote">
                Парные изображения из материалов проекта: исходный кадр и
                результат сегментации. Зелёные контуры показывают выделенные
                моделью области.
              </p>
            </div>
          ) : tab === "video" ? (
            <div className="mission-video">
              <div
                className="video-modes"
                role="group"
                aria-label="Режим видео"
              >
                <button
                  aria-pressed={mode === "segmentation"}
                  onClick={() => changeMode("segmentation")}
                >
                  Контуры объектов
                </button>
                <button
                  aria-pressed={mode === "detection"}
                  onClick={() => changeMode("detection")}
                >
                  Детекция рамками
                </button>
              </div>
              <video
                ref={video}
                key={mode}
                controls
                playsInline
                preload="metadata"
                poster="/media/river-poster.jpg"
                aria-label="Видео обследования реки"
                onLoadedMetadata={(e) => {
                  e.currentTarget.currentTime = Math.min(
                    target.current,
                    e.currentTarget.duration - 0.1,
                  );
                }}
                onTimeUpdate={update}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onError={() =>
                  setError(
                    "Не удалось открыть видео. Проверьте, что папка media находится рядом с index.html.",
                  )
                }
              >
                <source
                  src={"/media/river-" + mode + ".mp4"}
                  type="video/mp4"
                />
              </video>
              <div className="mission-playbar">
                <button
                  onClick={() => {
                    setError("");
                    if (playing) video.current.pause();
                    else
                      video.current
                        .play()
                        .catch(() =>
                          setError(
                            "Нажмите кнопку воспроизведения на самом видео.",
                          ),
                        );
                  }}
                  aria-label={
                    playing ? "Приостановить облёт" : "Воспроизвести облёт"
                  }
                >
                  {playing ? <Pause size={17} /> : <Play size={17} />}
                </button>
                <span>{stamp(time)} / 00:58</span>
                <span>ЗАПИСЬ ОБРАБОТКИ</span>
              </div>
              {error && <p role="alert">{error}</p>}
              <div className="checkpoint-row">
                {checkpoints.map((p, i) => (
                  <button
                    key={p.id}
                    className={i === index ? "active" : ""}
                    onClick={() => jump(i)}
                    aria-pressed={i === index}
                  >
                    <img src={"/media/checkpoint-" + p.time + ".jpg"} alt="" />
                    <span>
                      {stamp(p.time)}
                      <b>{p.title}</b>
                    </span>
                  </button>
                ))}
              </div>
              <p className="mission-footnote">
                Контрольные точки — фрагменты ролика, а не уникальные завалы. Их
                связь с участками A–C показана условно: телеметрия этого видео
                не предоставлена.
              </p>
            </div>
          ) : (
            <div className="passport-pane">
              <img
                src="/media/survey-segmentation.jpg"
                alt="Пример наблюдения с масками древесных скоплений"
              />
              <div className="passport-meta">
                <span>
                  <small>Материал</small>
                  <b>Кадр из AI_Center_site</b>
                </span>
                <span>
                  <small>Метод</small>
                  <b>Сегментация</b>
                </span>
                <span>
                  <small>Геопривязка кадра</small>
                  <b>Не предоставлена</b>
                </span>
                <span>
                  <small>Статус</small>
                  <b>{status}</b>
                </span>
              </div>
              <p className="mission-footnote">
                Пример паспорта наблюдения. Координаты и расстояния не
                подставлены из условной карты. Число масок не означает число
                уникальных завалов.
              </p>
            </div>
          )}
        </div>
        <aside className="mission-side">
          <div className="mission-side-kicker">
            <MapPin size={15} /> УЧЕБНЫЙ МАРШРУТ
          </div>
          <h3>
            От наблюдения
            <br />к полевой проверке.
          </h3>
          <p>
            Выберите фрагмент съёмки. Добавьте связанный демонстрационный
            участок в план.
          </p>
          <div className="mission-mini-map">
            <span>СХЕМА ПРОСМОТРА · НЕ ГЕОТРЕК</span>
            <svg
              viewBox="0 0 300 94"
              role="group"
              aria-label="Синхронная схема просмотра видео"
            >
              <path d="M25 55Q85 -10 150 53T275 45" className="mini-river" />
              <path d="M25 55H275" className="mini-timeline" />
              <circle
                className="mini-playhead"
                cx={25 + 250 * Math.min(time / 58, 1)}
                cy="55"
                r="5"
              />
              {checkpoints.map((p, i) => (
                <g
                  key={p.id}
                  role="button"
                  aria-label={"Перейти к точке " + p.id}
                  tabIndex="0"
                  onClick={() => jump(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      jump(i);
                    }
                  }}
                  className={index === i ? "active" : ""}
                >
                  <circle cx={25 + (250 * p.time) / 58} cy="55" r="12" />
                  <text x={25 + (250 * p.time) / 58} y="59" textAnchor="middle">
                    {p.id}
                  </text>
                </g>
              ))}
            </svg>
            <small>Позиция воспроизведения · {stamp(time)}</small>
          </div>
          <div
            className="mission-route"
            role="group"
            aria-label="Контрольные точки облёта"
          >
            {checkpoints.map((p, i) => (
              <button
                className={i === index ? "active" : ""}
                key={p.id}
                onClick={() => jump(i)}
                aria-pressed={i === index}
              >
                <b>{p.id}</b>
                <span>
                  {p.title}
                  <small>{stamp(p.time)} · показать фрагмент</small>
                </span>
                <ArrowUpRight size={14} />
              </button>
            ))}
          </div>
          <p className="checkpoint-description">{point.text}</p>
          <label className="field-label">
            Статус наблюдения
            <select
              aria-label="Статус наблюдения"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Заметка для бригады
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Что проверить на месте?"
              maxLength="600"
              rows="3"
            />
          </label>
          <button className="button primary" onClick={addPlan}>
            <ClipboardList size={16} /> Участок {point.id} в план{" "}
            <ArrowUpRight size={16} />
          </button>
          <small className="mission-footnote">
            Перенесём участок, статус и заметку в планировщик. Решение о
            расчистке принимает специалист.
          </small>
        </aside>
      </div>
      <div className="project-status">
        <article>
          <span className="status-label">
            <Check size={14} /> РЕАЛИЗОВАНО В ПРОЕКТЕ
          </span>
          <h3>Обнаружение → карта → отчёт</h3>
          <p>
            Нейросетевой анализ видео, трекинг, объединение наблюдений,
            геопривязка и подготовка материалов описаны в документации.
          </p>
        </article>
        <article>
          <span className="status-label concept">
            <ScanLine size={14} /> КОНЦЕПЦИЯ РАЗВИТИЯ
          </span>
          <h3>Координация полевых работ</h3>
          <p>
            Статусы, заметки и план выезда на этом сайте демонстрируют возможный
            рабочий процесс. Интеграции с бригадами пока нет.
          </p>
        </article>
      </div>
    </section>
  );
}
