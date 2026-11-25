import React, { useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUpRight, Check, ClipboardList, FileDown, Layers, MapPin, Maximize2,
  Minus, Pause, Play, Plus, RotateCcw, Route, Video,
} from "lucide-react";
import Planner from "./Planner";
import ImageViewer from "./ImageViewer";
import { segmentationVideo } from "./lib/river-video";
import records from "./lib/survey-data.json";
import basemap from "./lib/survey-basemap.json";
import { planningReaches, reachForRecord } from "./lib/survey-reaches";
import "./styles/survey.css";

const { bounds } = basemap;
const latitudes = [46.782, 46.778, 46.774];
const longitudes = [142.486, 142.490, 142.494, 142.498];

const longitudeX = (lon) => (100 * (lon - bounds.west)) / (bounds.east - bounds.west);
const latitudeY = (lat) => (100 * (bounds.north - lat)) / (bounds.north - bounds.south);

function position({ lat, lon }) {
  return {
    left: `${longitudeX(lon)}%`,
    top: `${latitudeY(lat)}%`,
  };
}

function mapPath(coordinates) {
  const points = coordinates.map(([lon, lat]) =>
    `${longitudeX(lon).toFixed(3)} ${latitudeY(lat).toFixed(3)}`
  );
  return `M${points.join(" L")}`;
}

const basemapLayers = [
  ["woods", true],
  ["builtArea", true],
  ["waterways", false],
  ["water", true],
  ["buildings", true],
  ["paths", false],
  ["roads", false],
].map(([layer, area]) => ({
  layer,
  paths: basemap.layers[layer].map((geometry) =>
    area ? geometry.map((ring) => `${mapPath(ring)} Z`).join(" ") : mapPath(geometry)
  ),
}));

const mapWidthMetres = (bounds.east - bounds.west) * 111320 *
  Math.cos((Math.PI * (bounds.north + bounds.south)) / 360);
const mapHeightMetres = (bounds.north - bounds.south) * 111320;

const featuredRecord = records.find(({ id }) => id === 19);
const isOnBank = ({ category }) => category === "Древесный завал на берегу/отмели";
const bankCount = records.filter(isOnBank).length;
const zoomLevels = [1, 1.25, 1.5, 1.75];
const surveyPhoto = (record) => `/media/survey/${record.photo}`;
const coordinates = ({ lat, lon }) => `${lat.toFixed(7)}, ${lon.toFixed(7)}`;
const confidence = (record) =>
  new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 }).format(record.confidence);

// The first exported waterway is the Lyutoga centreline. Keep both ends
// of the illustrative flight inset so the drone stays in the map frame.
const demoFlightPath = mapPath(basemap.layers.waterways[0].slice(3, -3));

function SurveyDemoFlight({ playing, run }) {
  const overlay = useRef(null);
  useLayoutEffect(() => {
    overlay.current.setCurrentTime?.(0);
  }, [run]);
  useLayoutEffect(() => {
    if (playing) overlay.current.unpauseAnimations?.();
    else overlay.current.pauseAnimations?.();
  }, [playing]);

  return (
    <svg ref={overlay} className="survey-flight-line survey-demo-flight"
      viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="survey-demo-trail" d={demoFlightPath} />
      <g className="survey-demo-drone">
        <animateMotion path={demoFlightPath} dur="18s" repeatCount="indefinite" />
        <circle className="survey-demo-camera" r="5.4" />
        <circle className="survey-demo-drone-badge" r="2.85" />
        <path d="M-1.35 -1.35L1.35 1.35M1.35 -1.35L-1.35 1.35" />
        <circle cx="-1.35" cy="-1.35" r=".66" />
        <circle cx="1.35" cy="-1.35" r=".66" />
        <circle cx="-1.35" cy="1.35" r=".66" />
        <circle cx="1.35" cy="1.35" r=".66" />
      </g>
    </svg>
  );
}

function SurveyMap({
  selectedId,
  onSelect,
  selectedReachIds = [],
  onToggleReach,
  zoom = 1,
  showRecords = true,
  showContext = true,
  children,
}) {
  const selected = records.find(({ id }) => id === selectedId);
  const center = selected && position(selected);
  return (
    <div className="survey-map" role="group" aria-label="Карта реки Лютоги и расчётных координат объектов обследования"
      style={{ aspectRatio: mapWidthMetres / mapHeightMetres }}>
      <div className="survey-map-content" style={zoom === 1 ? undefined : {
        transform: `scale(${zoom})`,
        transformOrigin: center ? `${center.left} ${center.top}` : "center",
      }}>
        <svg className="survey-basemap" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
          {basemapLayers.filter(({ layer }) => showContext || layer.startsWith("water")).map(({ layer, paths }) => (
            <g key={layer} className={`survey-layer-${layer}`}>
              {paths.map((path, index) => <path key={index} d={path} fillRule="evenodd" />)}
            </g>
          ))}
        </svg>
        {latitudes.map((lat) => (
          <div aria-hidden="true" key={lat} className="survey-grid-lat" style={{ top: `${latitudeY(lat)}%` }}>
            <span>{lat.toFixed(3)}° с. ш.</span>
          </div>
        ))}
        {longitudes.map((lon) => (
          <div aria-hidden="true" key={lon} className="survey-grid-lon" style={{ left: `${longitudeX(lon)}%` }}>
            <span>{lon.toFixed(3)}°</span>
          </div>
        ))}
        {basemap.labels.filter(({ kind }) => showContext || kind === "river").map((label) => (
          <span key={label.name} className={`survey-map-label survey-map-label-${label.kind}`}
            style={position(label)} aria-hidden="true">
            {label.name}
          </span>
        ))}
        {children}
        {showRecords && records.map((record) => {
          const selected = record.id === selectedId;
          const style = position(record);
          const inPlan = selectedReachIds.includes(reachForRecord(record.id).id);
          const onBank = isOnBank(record);
          const classes = `survey-pin${selected ? " is-selected" : ""}${inPlan ? " is-in-plan" : ""}${onBank ? " is-on-bank" : ""}`;
          return (
            <button key={record.id} type="button" className={classes} style={style}
              onClick={() => onSelect(record.id)} aria-label={`Объект №${record.id}`}
              aria-pressed={selected} title={`Объект №${record.id}`}>
              {selected ? record.id : <span aria-hidden="true" />}
            </button>
          );
        })}
        {planningReaches.map((reach) => (
          <button key={reach.id} type="button" className="survey-reach-marker"
            style={position(records.find(({ id }) => id === reach.markerId))}
            aria-label={`Участок ${reach.id} на карте — ${reach.name}`}
            aria-pressed={selectedReachIds.includes(reach.id)}
            title={reach.name}
            onClick={() => onToggleReach(reach.id)}>
            {reach.id}
          </button>
        ))}
      </div>
      <div aria-hidden="true" className="survey-north">↑ <span>С</span></div>
      <div aria-hidden="true" className="survey-scale" style={{ width: `${(100 * 200 * zoom) / mapWidthMetres}%` }}>200 м</div>
      <span className="survey-map-attribution">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{basemap.attribution}</a>
      </span>
    </div>
  );
}

function SurveyObjectCard({ record, onPlan, inPlan }) {
  const reach = reachForRecord(record.id);
  const [photoOpen, setPhotoOpen] = useState(false);
  const photo = surveyPhoto(record);
  const photoDescription = `Кадр из отчёта с разметкой объекта №${record.id}`;
  return (
    <article className="survey-card" aria-label="Карточка выбранного объекта">
      <button type="button" className="survey-photo-preview" aria-haspopup="dialog"
        aria-label={`Увеличить кадр объекта №${record.id}`} onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          setPhotoOpen(true);
        }}>
        <img src={photo} alt={photoDescription} width={1440} height={612} />
        <span aria-hidden="true"><Maximize2 size={16} /> Увеличить</span>
      </button>
      <div className="survey-card-copy" aria-live="polite">
        <p className="survey-eyebrow">Объект №{record.id}</p>
        <h3>{record.category}</h3>
        <dl>
          <div><dt>Координаты (расчёт)</dt><dd>{coordinates(record)}</dd></div>
          <div><dt>Время съёмки</dt><dd>{record.time.slice(11)}</dd></div>
          <div><dt>Уверенность модели</dt><dd>{confidence(record)}</dd></div>
          <div><dt>Участок</dt><dd>{reach.id} · {reach.name}</dd></div>
        </dl>
        <button className="survey-add-to-plan" type="button" disabled={inPlan} onClick={() => onPlan(reach.id)}>
          {inPlan ? <Check size={16} /> : <ClipboardList size={16} />}
          {inPlan ? `Участок ${reach.id} в плане` : `Участок ${reach.id} в план`}
        </button>
      </div>
      {photoOpen && (
        <ImageViewer title={`Объект №${record.id} · кадр из отчёта`} onClose={() => setPhotoOpen(false)}>
          <img src={photo} alt={photoDescription} className="survey-report-photo" width={1440} height={612} />
        </ImageViewer>
      )}
    </article>
  );
}

function downloadCsv() {
  const header = "ID;Класс объекта;Расчётная широта;Расчётная долгота;Участок;Уверенность модели (0–1)";
  const rows = records.map((record) => [
    record.id, record.category, record.lat, record.lon, reachForRecord(record.id).id, record.confidence,
  ].join(";"));
  const url = URL.createObjectURL(new Blob(["\uFEFF" + [header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "RIVER-lyutoga.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function SurveyRegistry({ selectedId, onSelect }) {
  const viewport = useRef(null);
  const activeRow = useRef(null);
  useLayoutEffect(() => {
    const list = viewport.current;
    const row = activeRow.current.getBoundingClientRect();
    const bounds = list.getBoundingClientRect();
    const headerBottom = list.querySelector("thead th").getBoundingClientRect().bottom;
    if (row.top < headerBottom) list.scrollTop += row.top - headerBottom;
    else if (row.bottom > bounds.bottom - 1) list.scrollTop += row.bottom - bounds.bottom + 1;
  }, [selectedId]);

  return (
    <div className="survey-registry">
      <div className="survey-registry-heading">
        <h3 id="survey-registry-title">Объекты из отчёта <span>{records.length}</span></h3>
        <div>
          <button type="button" onClick={downloadCsv} aria-label="Скачать данные отчёта (CSV)">CSV</button>
          <a href="/media/survey/client_report.xlsx" download aria-label="Скачать отчёт Excel">
            <FileDown size={15} /> Excel
          </a>
        </div>
      </div>
      <div ref={viewport} className="survey-table-scroll" tabIndex={0}
        role="region" aria-labelledby="survey-registry-title">
        <table className="survey-table" aria-labelledby="survey-registry-title">
          <thead><tr><th scope="col">№</th><th scope="col">Расположение</th><th scope="col">Участок</th><th scope="col">Уверенность</th></tr></thead>
          <tbody>
            {records.map((record) => {
              const active = record.id === selectedId;
              return (
                <tr key={record.id} ref={active ? activeRow : null} className={active ? "is-selected" : ""} onClick={() => onSelect(record.id)}>
                  <th scope="row">
                    <button type="button" onClick={(event) => {
                      event.stopPropagation();
                      onSelect(record.id);
                    }} aria-label={`Показать объект №${record.id} на карте`} aria-pressed={active}>
                      {record.id}
                    </button>
                  </th>
                  <td>{isOnBank(record) ? "Берег / отмель" : "В воде"}</td>
                  <td>{reachForRecord(record.id).id}</td><td>{confidence(record)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SurveyWorkspace({ selectedReaches, toggleReach, addReach }) {
  const [selectedId, setSelectedId] = useState(featuredRecord.id);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [showContext, setShowContext] = useState(true);
  const [showRecords, setShowRecords] = useState(true);
  const [showFlight, setShowFlight] = useState(true);
  const [flightPlaying, setFlightPlaying] = useState(() => !matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [flightRun, setFlightRun] = useState(0);
  const record = records.find(({ id }) => id === selectedId);

  function selectRecord(id) {
    setSelectedId(id);
    setShowRecords(true);
  }

  return (
    <div className="survey-layout">
      <div id="survey-map-panel" className="demo-map-panel" aria-label="Дефектовка древесных завалов">
        <div className="survey-map-heading">
          <h3>Дефектовка завалов</h3>
          <a href="#planner">План выезда <ArrowUpRight size={15} /></a>
        </div>
        <SurveyMap selectedId={selectedId} onSelect={selectRecord} zoom={zoomLevels[zoomIndex]}
          showContext={showContext} showRecords={showRecords} selectedReachIds={selectedReaches} onToggleReach={toggleReach}>
          {showFlight && <SurveyDemoFlight playing={flightPlaying} run={flightRun} />}
        </SurveyMap>
        <div className="demo-map-controls" role="group" aria-label="Управление картой">
          <button type="button" aria-label="Приблизить" title="Приблизить"
            disabled={zoomIndex === zoomLevels.length - 1}
            onClick={() => setZoomIndex(zoomIndex + 1)}><Plus size={17} /></button>
          <button type="button" aria-label="Отдалить" title="Отдалить" disabled={zoomIndex === 0}
            onClick={() => setZoomIndex(zoomIndex - 1)}><Minus size={17} /></button>
          <button type="button" aria-label="Сбросить масштаб" title="Сбросить масштаб" disabled={zoomIndex === 0}
            onClick={() => setZoomIndex(0)}><RotateCcw size={16} /></button>
          <button type="button" aria-label="Дороги, здания и лес" title="Дороги, здания и лес"
            aria-pressed={showContext} onClick={() => setShowContext(!showContext)}><Layers size={17} /></button>
          <button type="button" aria-label="Точки обследования" title="Точки обследования"
            aria-pressed={showRecords} onClick={() => setShowRecords(!showRecords)}><MapPin size={17} /></button>
          <button type="button" className="demo-flight-toggle" aria-pressed={showFlight}
            onClick={() => setShowFlight(!showFlight)}><Route size={17} /> Маршрут БПЛА</button>
          {showFlight && (
            <>
              <button type="button" aria-label={flightPlaying ? "Пауза пролёта" : "Продолжить пролёт"}
                title={flightPlaying ? "Пауза пролёта" : "Продолжить пролёт"}
                onClick={() => setFlightPlaying(!flightPlaying)}>
                {flightPlaying ? <Pause size={17} /> : <Play size={17} />}
              </button>
              <button type="button" aria-label="Повторить пролёт с начала" title="Повторить пролёт с начала"
                onClick={() => {
                  setFlightRun((run) => run + 1);
                  setFlightPlaying(true);
                }}><RotateCcw size={17} /></button>
            </>
          )}
        </div>
        <div className="demo-map-key" aria-label="Обозначения карты">
          {showFlight && <span><i className="demo-key-flight" aria-hidden="true" /> Условная траектория БПЛА</span>}
          {showRecords && (
            <>
              <span><i aria-hidden="true" /> В воде · {records.length - bankCount}</span>
              <span><i className="demo-key-bank" aria-hidden="true" /> На берегу или отмели · {bankCount}</span>
            </>
          )}
        </div>
        <p className="survey-map-note">Точки нанесены по расчётным координатам из отчёта. Точность в отчёте не указана.</p>
      </div>
      <div className="survey-inspector">
        <SurveyObjectCard record={record} onPlan={addReach} inPlan={selectedReaches.includes(reachForRecord(record.id).id)} />
        <SurveyRegistry selectedId={selectedId} onSelect={selectRecord} />
      </div>
    </div>
  );
}

export default function Survey({ onPresentationOpen }) {
  const presentation = useRef(null);
  const presentationVideo = useRef(null);
  const presentationTrigger = useRef(null);

  function playPresentation() {
    onPresentationOpen();
    presentation.current.showModal();
    const video = presentationVideo.current;
    video.currentTime = 0;
    video.play().catch(() => {});
  }

  function closePresentation() {
    presentationVideo.current.pause();
    presentationTrigger.current.focus({ preventScroll: true });
  }

  return (
    <section id="survey" className="survey-section section" aria-labelledby="survey-title">
      <div id="demo" className="section-kicker">03 / ИНТЕРАКТИВНАЯ ДЕМОНСТРАЦИЯ</div>
      <div className="section-heading survey-heading">
        <div>
          <p className="survey-eyebrow">Лютога · 2 июля 2025</p>
          <h2 id="survey-title">Пример обследования</h2>
        </div>
        <p>Выберите завал на карте или в реестре, просмотрите кадр из отчёта и добавьте участок в план выезда.</p>
      </div>
      <div className="survey-actions">
        <a href="#planner"><ClipboardList size={17} /> План выезда</a>
        <button type="button" ref={presentationTrigger} aria-haspopup="dialog" onClick={playPresentation}>
          <Play size={17} /> Автопрезентация · 90 сек.
        </button>
      </div>
      <dialog ref={presentation} className="survey-presentation" aria-labelledby="survey-presentation-title"
        onClose={closePresentation}>
        <div className="survey-presentation-bar">
          <h3 id="survey-presentation-title">Автопрезентация обследования</h3>
          <button type="button" autoFocus onClick={() => presentation.current.close()}>К карте</button>
        </div>
        <video ref={presentationVideo} src="/media/RIVER-AIJ-2026.mp4" poster="/media/survey-intro-poster.jpg"
          aria-label="90-секундное видео RIVER для AIJ-2026" controls muted playsInline loop preload="none" />
      </dialog>
      <details id="survey-footage" className="survey-video" onToggle={(event) => {
        if (!event.currentTarget.open) event.currentTarget.querySelector("video").pause();
      }}>
        <summary><Video size={17} /> Видео с разметкой завалов · 27 сек.</summary>
        <video src={segmentationVideo.src} poster={segmentationVideo.poster}
          aria-label="Аэросъёмка реки с масками обнаруженных древесных завалов"
          controls muted playsInline preload="none" />
        <a href="#video">Сравнить режимы обработки <ArrowUpRight size={15} /></a>
      </details>
      <Planner renderSurvey={(plan) => <SurveyWorkspace {...plan} />} />
    </section>
  );
}
