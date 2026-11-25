import { segmentationVideo, stamp } from "./lib/river-video";
import React, { useRef, useState, useEffect } from "react";
import {
  ArrowUpRight,
  Check,
  MapPin,
  Play,
  Pause,
  ScanLine,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
const checkpointDetails = [
  {
    id: "1",
    photoKey: "A",
    title: "Начало облёта",
    text: "Посмотрите, как модель выделяет древесину на береговой линии.",
  },
  {
    id: "2",
    photoKey: "B",
    title: "Обзор излучины",
    text: "Смена ракурса показывает, почему наблюдения нужно связывать между кадрами.",
  },
  {
    id: "3",
    photoKey: "C",
    title: "Продолжение маршрута",
    text: "Оцените результат на следующих кадрах обследования.",
  },
];
const modes = {
  segmentation: {
    src: segmentationVideo.src,
    duration: 26.655,
    times: [0, 9, 22],
  },
  detection: {
    src: "/media/river-detection.mp4",
    duration: 58.125,
    times: [5, 24, 43],
  },
};

export default function Mission() {
  const [expanded, setExpanded] = useState(false);
  const section = useRef(null);
  const [tab, setTab] = useState("compare"),
    [split, setSplit] = useState(50),
    [mode, setMode] = useState("segmentation"),
    [index, setIndex] = useState(0),
    [time, setTime] = useState(0),
    [duration, setDuration] = useState(modes.segmentation.duration),
    [playing, setPlaying] = useState(false),
    [error, setError] = useState("");
  const video = useRef(null),
    target = useRef(0);
  const clip = modes[mode];
  const checkpoints = checkpointDetails.map((point, i) => ({
    ...point,
    time: clip.times[i],
    photo: `/media/checkpoint-${mode}-${point.photoKey}.jpg`,
  }));
  const point = checkpoints[index];
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
    if (m === mode) return;
    target.current = modes[m].times[index];
    setTime(target.current);
    setDuration(modes[m].duration);
    setError("");
    setPlaying(false);
    setMode(m);
  }
  function openSurvey() {
    setExpanded(false);
    requestAnimationFrame(() =>
      document.getElementById("survey").scrollIntoView({
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
        <div className="section-kicker">
          {expanded ? "ДЕМОНСТРАЦИЯ ОБСЛЕДОВАНИЯ · ESC — ВЫХОД" : "ОДНО ОБСЛЕДОВАНИЕ / ОТ КАДРА К ПЛАНУ"}
        </div>
        <button
          className="expand-mission"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}{" "}
          {expanded ? "Свернуть демонстрацию" : "Развернуть демонстрацию"}
        </button>
      </div>
      <div className="section-heading">
        <h2>
          Увидеть своими глазами.
          <br />
          <span>Решить, что делать дальше.</span>
        </h2>
        <p>
          Реальная съёмка и результаты модели.
          <br />
          Исследуйте материалы съёмки и перейдите к карте обследования.
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
              ["video", "Видео и фрагменты"],
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
          ) : (
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
                poster={checkpoints[0].photo}
                aria-label="Видео обследования реки"
                onLoadedMetadata={(e) => {
                  setDuration(e.currentTarget.duration);
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
                  src={clip.src}
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
                <span>{stamp(time >= duration ? Math.ceil(duration) : time)} / {stamp(Math.ceil(duration))}</span>
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
                    <img src={p.photo} alt="" />
                    <span>
                      {stamp(p.time)}
                      <b>{p.title}</b>
                    </span>
                  </button>
                ))}
              </div>
              <p className="mission-footnote">
                Контрольные точки обозначают время в ролике. Участки карты
                построены по координатам из отчёта обследования.
              </p>
            </div>
          )}
        </div>
        <aside className="mission-side">
          <div className="mission-side-kicker">
            <MapPin size={15} /> ФРАГМЕНТЫ ОБЛЁТА
          </div>
          <h3>
            От видео
            <br />к карте обследования.
          </h3>
          <p>
            Выберите фрагмент съёмки, затем откройте карту с объектами из отчёта.
          </p>
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
          <button className="button primary" onClick={openSurvey}>
            <MapPin size={16} /> К карте обследования{" "}
            <ArrowUpRight size={16} />
          </button>
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
            Учебный план выезда показывает, как передать бригаде сведения
            о проверенных объектах.
          </p>
        </article>
      </div>
    </section>
  );
}
