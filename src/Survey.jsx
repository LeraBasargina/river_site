import React, { useLayoutEffect, useRef } from "react";
import { ArrowUpRight, ClipboardList, FileDown, MapPin, Play, Video } from "lucide-react";
import records from "./lib/survey-data.json";
import basemap from "./lib/survey-basemap.json";
import { showDuration } from "./lib/auto-show-timeline";
import { segmentationVideo } from "./lib/river-video";
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

export const featuredRecord = records.find(({ id }) => id === 19);
export const surveyPhoto = (record) => `/media/survey/${record.photo}`;
export const coordinates = ({ lat, lon }) => `${lat.toFixed(7)}, ${lon.toFixed(7)}`;
export const confidence = (record) =>
  new Intl.NumberFormat("ru-RU", { style: "percent", maximumFractionDigits: 1 }).format(record.confidence);

// The first exported waterway is the Lyutoga centreline. Keep both ends
// of the illustrative flight inset so the drone stays in the map frame.
const demoFlightPath = mapPath(basemap.layers.waterways[0].slice(3, -3));

export function SurveyDemoFlight({ playing, run }) {
  const overlay = useRef(null);
  useLayoutEffect(() => {
    overlay.current.setCurrentTime(0);
  }, [run]);
  useLayoutEffect(() => {
    if (playing) overlay.current.unpauseAnimations();
    else overlay.current.pauseAnimations();
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

export function SurveyMap({
  selectedId,
  onSelect,
  flight = null,
  selectedReachIds = [],
  onToggleReach,
  zoom = 1,
  showRecords = true,
  showContext = true,
  showRecordCategories = false,
  children,
}) {
  const selected = records.find(({ id }) => id === selectedId);
  const center = selected && position(selected);
  // Illustrative animation. The report has object coordinates only.
  const start = { lat: 46.7715, lon: 142.4985 };
  const drone = {
    lat: start.lat + (featuredRecord.lat - start.lat) * flight,
    lon: start.lon + (featuredRecord.lon - start.lon) * flight,
  };

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
          const inPlan = onToggleReach && selectedReachIds.includes(reachForRecord(record.id).id);
          const onBank = showRecordCategories && record.category === "Древесный завал на берегу/отмели";
          const classes = `survey-pin${selected ? " is-selected" : ""}${inPlan ? " is-in-plan" : ""}${onBank ? " is-on-bank" : ""}`;
          return onSelect ? (
            <button key={record.id} type="button" className={classes} style={style}
              onClick={() => onSelect(record.id)} aria-label={`Объект №${record.id}`}
              aria-pressed={selected} title={`Объект №${record.id}`}>
              {selected ? record.id : <span aria-hidden="true" />}
            </button>
          ) : (
            <span key={record.id} className={classes} style={style} aria-hidden="true">
              {selected ? record.id : <span />}
            </span>
          );
        })}
        {onToggleReach && planningReaches.map((reach) => (
          <button key={reach.id} type="button" className="survey-reach-marker"
            style={position(records.find(({ id }) => id === reach.markerId))}
            aria-label={`Участок ${reach.id} на карте — ${reach.name}`}
            aria-pressed={selectedReachIds.includes(reach.id)}
            title={reach.name}
            onClick={() => onToggleReach(reach.id)}>
            {reach.id}
          </button>
        ))}
        {flight !== null && (
          <>
            <svg className="survey-flight-line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
              <line x1={position(start).left} y1={position(start).top}
                x2={position(drone).left} y2={position(drone).top} />
            </svg>
            <div className="survey-drone" style={position(drone)} aria-hidden="true">
              <span className="survey-drone-body" />
              <span className="survey-rotor top-left" />
              <span className="survey-rotor top-right" />
              <span className="survey-rotor bottom-left" />
              <span className="survey-rotor bottom-right" />
            </div>
          </>
        )}
      </div>
      <div aria-hidden="true" className="survey-north">↑ <span>С</span></div>
      <div aria-hidden="true" className="survey-scale" style={{ width: `${(100 * 200 * zoom) / mapWidthMetres}%` }}>200 м</div>
      <span className="survey-map-attribution">
        {onSelect
          ? <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">{basemap.attribution}</a>
          : "© OpenStreetMap"}
      </span>
    </div>
  );
}

export function SurveyObjectCard({ record: selected, onPlan }) {
  const reach = reachForRecord(selected.id);
  return (
    <article className="survey-card" aria-label="Карточка выбранного объекта">
      <a className="survey-photo-link" href={surveyPhoto(selected)} target="_blank" rel="noreferrer"
        aria-label={`Открыть кадр объекта №${selected.id} в новой вкладке`}>
        <img src={surveyPhoto(selected)} alt={`Кадр из отчёта с разметкой объекта №${selected.id}`} />
        <ArrowUpRight size={18} />
      </a>
      <div className="survey-card-copy" aria-live="polite">
        <p className="survey-eyebrow">Объект №{selected.id}</p>
        <h3>{selected.category}</h3>
        <dl>
          <div><dt>Время съёмки</dt><dd>{selected.time}</dd></div>
          <div><dt>Координаты (расчёт)</dt><dd>{coordinates(selected)}</dd></div>
          <div><dt>Уверенность модели</dt><dd>{confidence(selected)}</dd></div>
          <div><dt>Участок планирования</dt><dd>{reach.id} · {reach.name}</dd></div>
        </dl>
        {onPlan && (
          <button className="survey-add-to-plan" type="button" onClick={() => onPlan(reach.id)}>
            <ClipboardList size={16} /> Участок {reach.id} в план
          </button>
        )}
      </div>
    </article>
  );
}

export default function Survey({ selectedId, onSelect, onShow, onPlan }) {
  const selected = records.find(({ id }) => id === selectedId);
  return (
    <section id="survey" className="survey-section section" aria-labelledby="survey-title">
      <div className="section-heading survey-heading">
        <div>
          <p className="survey-eyebrow">Материалы обследования · 2 июля 2025</p>
          <h2 id="survey-title">Пример обследования</h2>
        </div>
        <p>22 записи из отчёта. Выберите точку на карте или строку в таблице, чтобы открыть карточку объекта.</p>
      </div>
      <div className="survey-actions">
        <a href="/media/survey/client_report.xlsx" download><FileDown size={18} /> Скачать отчёт Excel</a>
        <button type="button" onClick={onShow}><Play size={17} /> Смотреть автопоказ · {showDuration} сек.</button>
      </div>

      <details className="survey-video" onToggle={(event) => {
        if (!event.currentTarget.open) event.currentTarget.querySelector("video").pause();
      }}>
        <summary><Video size={18} /> Видео с разметкой завалов · 27 сек.</summary>
        <video src={segmentationVideo.src} poster={segmentationVideo.poster}
          aria-label="Аэросъёмка реки с масками обнаруженных древесных завалов"
          controls playsInline preload="none" />
      </details>

      <div className="survey-layout">
        <div id="survey-map-panel" className="survey-map-panel" tabIndex={-1}>
          <SurveyMap selectedId={selectedId} onSelect={onSelect} />
          <p className="survey-map-caption">
            <span><MapPin size={16} /> Расчётные координаты из отчёта</span>
            <span><i aria-hidden="true" /> Русло</span>
            <span><i className="survey-road-key" aria-hidden="true" /> Дороги</span>
          </p>
        </div>
        <SurveyObjectCard record={selected} onPlan={onPlan} />
      </div>
      <p className="survey-note">Точки нанесены по расчётным координатам из отчёта. Их точность в отчёте не указана. Решение о расчистке принимается после оценки участка.</p>

      <div className="survey-table-scroll" tabIndex={0} role="region" aria-label="Таблица объектов обследования">
        <table className="survey-table">
          <caption>Объекты из отчёта</caption>
          <thead><tr><th scope="col">ID</th><th scope="col">Класс объекта</th><th scope="col">Время съёмки</th><th scope="col">Координаты (расчёт)</th><th scope="col">Уверенность модели</th></tr></thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id} className={record.id === selectedId ? "is-selected" : ""} onClick={() => onSelect(record.id)}>
                <th scope="row">
                  <button type="button" onClick={(event) => {
                    event.stopPropagation();
                    onSelect(record.id);
                  }} aria-label={`Показать объект №${record.id} на карте`} aria-pressed={record.id === selectedId}>
                    {record.id}
                  </button>
                </th>
                <td>{record.category}</td><td>{record.time.slice(11)}</td><td>{coordinates(record)}</td><td>{confidence(record)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
