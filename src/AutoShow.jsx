import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Maximize, Pause, Play, X } from "lucide-react";
import "./styles/auto-show.css";

const stops = [
  { target: "intro", title: "RIVER", seconds: 6 },
  { target: "about", title: "О проекте", seconds: 6 },
  { target: "workflow", title: "Принцип работы", seconds: 6 },
  { target: "video", title: "От кадра к плану", seconds: 7 },
  { target: "tracking-demo", title: "Объединение наблюдений", seconds: 8 },
  { target: "survey-footage", title: "Видео обследования", seconds: 11 },
  { target: "survey-map-panel", title: "Дефектовка и реестр", seconds: 18 },
  { target: "planner", title: "План устранения", seconds: 14 },
  { target: "results", title: "Результаты", seconds: 7 },
  { target: "closing", title: "Сахалинский центр ИИ", seconds: 7 },
];

export default function AutoShow({ close }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const controls = useRef(null);
  const fullscreen = useRef(false);
  const stop = stops[index];

  function step(offset) {
    setIndex((current) => (current + offset + stops.length) % stops.length);
  }

  useEffect(() => {
    const previous = document.activeElement;
    controls.current.querySelector("button").focus({ preventScroll: true });
    function exitOnEscape(event) {
      if (event.key === "Escape" && !event.defaultPrevented && !document.querySelector("dialog[open]")) {
        close();
      }
    }
    document.addEventListener("keydown", exitOnEscape);
    return () => {
      document.removeEventListener("keydown", exitOnEscape);
      if (fullscreen.current && document.fullscreenElement === document.documentElement) {
        document.exitFullscreen().catch(() => {});
      }
      previous?.focus({ preventScroll: true });
    };
  }, [close]);

  useEffect(() => {
    const element = document.getElementById(stop.target);
    const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth";
    element?.scrollIntoView({ behavior, block: "start" });
    if (stop.target !== "survey-footage") return;
    const wasOpen = element.open;
    element.open = true;
    const video = element.querySelector("video");
    const previousTime = video.currentTime;
    video.currentTime = 0;
    return () => {
      video.pause();
      video.currentTime = previousTime;
      element.open = wasOpen;
    };
  }, [stop]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setIndex((current) => (current + 1) % stops.length);
    }, stop.seconds * 1000);
    const video = stop.target === "survey-footage" ? document.querySelector("#survey-footage video") : null;
    video?.play().catch(() => {});
    return () => {
      window.clearTimeout(timer);
      video?.pause();
    };
  }, [playing, stop]);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        fullscreen.current = false;
      } else {
        await document.documentElement.requestFullscreen();
        fullscreen.current = true;
      }
    } catch {}
  }

  return (
    <div ref={controls} className="presentation-controls" role="region" aria-label="Управление автопрезентацией">
      <span aria-live="polite"><b>{stop.title}</b><small>{index + 1} из {stops.length}</small></span>
      <div className="presentation-buttons">
        <button type="button" aria-label={playing ? "Пауза автопрезентации" : "Продолжить автопрезентацию"}
          title={playing ? "Пауза" : "Продолжить"} onClick={() => setPlaying((value) => !value)}>
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button type="button" aria-label="Предыдущий экран" title="Предыдущий экран" onClick={() => step(-1)}><ArrowLeft size={18} /></button>
        <button type="button" aria-label="Следующий экран" title="Следующий экран" onClick={() => step(1)}><ArrowRight size={18} /></button>
        {document.fullscreenEnabled && (
          <button type="button" aria-label="Переключить полноэкранный режим" title="Полноэкранный режим"
            onClick={toggleFullscreen}><Maximize size={17} /></button>
        )}
        <button type="button" aria-label="Завершить автопрезентацию" title="Завершить" onClick={close}><X size={19} /></button>
      </div>
    </div>
  );
}
