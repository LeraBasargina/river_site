import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Maximize, Pause, Play, Waves, X } from "lucide-react";
import { confidence, segmentationVideo, SurveyMap, surveyPhoto } from "./Survey";
import { planningReaches } from "./Planner";
import { sceneAt, showDuration, showFadeDuration, showScenes } from "./lib/auto-show-timeline";
import { TEAMS } from "./lib/plan-storage";
import records from "./lib/survey-data.json";
import "./styles/auto-show.css";

const introPoster = "/media/survey-intro-poster.jpg";

function syncVideo(video, scene, time, playing) {
  if (!playing || scene.videoFrom === undefined) video.pause();
  if (scene.videoFrom === undefined) return;

  const offset = scene.videoFrom + time - scene.at;
  if (!playing || Math.abs(video.currentTime - offset) > 0.2) video.currentTime = offset;
  if (playing) video.play().catch(() => {});
}

function ShowPlan() {
  return (
    <div className="auto-map-scene auto-plan-scene">
      <div className="auto-copy auto-scene-copy">
        <p>Учебный пример</p>
        <h2>Планируем полевой осмотр</h2>
        <span>Выбираем участки и назначаем бригаду.</span>
      </div>
      <div className="auto-plan-card">
        <h3>План выезда</h3>
        <ul>
          {planningReaches.slice(0, 2).map(({ id, name }) => (
            <li key={id}><Check aria-hidden="true" size={22} /> Участок {id} · {name}</li>
          ))}
        </ul>
        <dl>
          <div><dt>Бригада</dt><dd>{TEAMS[0]}</dd></div>
          <div><dt>Задача</dt><dd>Полевой осмотр</dd></div>
        </dl>
        <p>Решение о расчистке принимают после оценки участка.</p>
      </div>
    </div>
  );
}

export default function AutoShow({ onClose }) {
  const dialog = useRef(null);
  const aerial = useRef(null);
  const playhead = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(() => !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const scene = sceneAt(elapsed);
  const kind = scene.kind;
  const record = kind === "report" ? records.find(({ id }) => id === scene.recordId) : null;
  const flight = kind === "flight" ? (elapsed - scene.at) / (showScenes[2].at - scene.at) : null;
  const fade = !playing && (elapsed === 0 || elapsed === showDuration) ? 0 :
    Math.max(0, 1 - Math.min(elapsed, showDuration - elapsed) / showFadeDuration);

  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame;
    const start = performance.now() - playhead.current * 1000;
    const advance = (now) => {
      const next = Math.max(0, (now - start) / 1000) % showDuration;
      playhead.current = next;
      setElapsed(next);
      frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  useEffect(() => {
    syncVideo(aerial.current, scene, playhead.current, playing);
  }, [scene, playing]);

  function close(returnToMap = false) {
    dialog.current.close();
    onClose(returnToMap);
  }

  function seek(value) {
    setPlaying(false);
    playhead.current = value;
    setElapsed(value);
    syncVideo(aerial.current, sceneAt(value), value, false);
  }

  function togglePlayback() {
    if (elapsed === showDuration) {
      playhead.current = 0;
      setElapsed(0);
    }
    setPlaying((value) => !value);
  }

  return (
    <dialog ref={dialog} className="auto-show" aria-labelledby="auto-title"
      onCancel={(event) => { event.preventDefault(); close(); }}>
      <div className="auto-toolbar">
        <span id="auto-title"><Waves size={23} /> RIVER <span>· AIJ-2026</span></span>
        <div>
          <button type="button" className="auto-return" onClick={() => close(true)}>
            <ArrowLeft size={17} /> К карте
          </button>
          {document.fullscreenEnabled && <button type="button" aria-label="Переключить полноэкранный режим" onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            else dialog.current.requestFullscreen().catch(() => {});
          }}><Maximize size={19} /></button>}
          <button type="button" onClick={() => close()} aria-label="Закрыть автопоказ"><X size={23} /></button>
        </div>
      </div>
      <div className={`auto-stage auto-stage-${kind}`} data-scene-at={scene.at}>
        <video ref={aerial} className={kind === "detection" ? "auto-aerial auto-detection-video" : "auto-aerial"}
          src={segmentationVideo.src} poster={kind === "detection" ? segmentationVideo.poster : introPoster}
          hidden={scene.videoFrom === undefined}
          preload="auto" muted playsInline aria-hidden="true" />
        {kind === "intro" && (
          <div className="auto-copy auto-intro">
            <p>Сахалинский центр ИИ</p>
            <h2>RIVER</h2>
            <span>Древесные завалы на реках глазами беспилотника</span>
          </div>
        )}
        {kind === "detection" && (
          <div className="auto-copy auto-detection-copy">
            <p>Фрагмент видеообработки</p>
            <h2>Выявляем<br />древесные завалы</h2>
          </div>
        )}
        {(kind === "flight" || kind === "report") && (
          <div className="auto-map-scene">
            <div className="auto-map-side">
              <SurveyMap selectedId={record?.id ?? null} flight={flight} />
              <p>{kind === "flight" ? "Точки из отчёта · траектория полёта условная" : "Расчётные координаты из отчёта"}</p>
            </div>
            <div className="auto-copy auto-scene-copy">
              <p>Обследование · 2 июля 2025</p>
              {kind === "flight" && <h2>Беспилотник снимает речной участок</h2>}
              {record && (
                <>
                  <h2>Объект № {record.id}</h2>
                  <div className="auto-object-photo">
                    <img src={surveyPhoto(record)} alt={`Кадр объекта № ${record.id} из отчёта`} />
                  </div>
                  <span>{record.category}</span>
                  <small>Уверенность модели · {confidence(record)}</small>
                </>
              )}
            </div>
          </div>
        )}
        {kind === "plan" && <ShowPlan />}
        {kind === "outro" && (
          <div className="auto-copy auto-outro">
            <p><Waves size={27} aria-hidden="true" /> RIVER</p>
            <h2>Сахалинский<br />центр ИИ</h2>
            <span>От аэросъёмки к карте и плану осмотра</span>
          </div>
        )}
        <div className="auto-fade" style={{ opacity: fade }} aria-hidden="true" />
      </div>
      <div className="auto-controls">
        <button type="button" onClick={togglePlayback} aria-label={playing ? "Пауза" : "Воспроизвести"}>
          {playing ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <input type="range" min="0" max={showDuration} step="0.1" value={elapsed}
          aria-label="Позиция автопоказа" onChange={(event) => seek(Number(event.target.value))} />
        <span>{String(Math.floor(elapsed)).padStart(2, "0")} / {showDuration} с</span>
        <span className="auto-current-phase">{scene.title}</span>
      </div>
    </dialog>
  );
}
