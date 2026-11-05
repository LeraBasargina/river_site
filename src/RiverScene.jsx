import React, { useId, useState } from "react";
import {
  Plus,
  Minus,
  Layers,
  Navigation,
  ScanLine,
  Route,
  RotateCcw,
} from "lucide-react";
const river =
  "M510 -60 C140 35 610 175 400 290 S665 420 455 540 S170 635 300 850";
const points = [
  { x: 400, y: 290, id: "01", kind: "В воде", score: 94 },
  { x: 513, y: 472, id: "02", kind: "На отмели", score: 89 },
  { x: 305, y: 660, id: "03", kind: "В воде", score: 91 },
];
export default function RiverScene({
  interactive = false,
  stage = 3,
  selected = 0,
  onSelect = () => {},
}) {
  const uid = useId().replaceAll(":", "");
  const [zoom, setZoom] = useState(1),
    [overlay, setOverlay] = useState(true),
    [route, setRoute] = useState(true);
  const ref = (n) => `url(#${uid + n})`;
  return (
    <div
      className={
        "river-scene " +
        (interactive ? "scene-interactive interactive" : "scene-hero")
      }
    >
      <svg
        className="scene-canvas"
        viewBox="0 0 800 800"
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label="Интерактивная схема речного обследования"
      >
        <defs>
          <pattern
            id={uid + "grid"}
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path d="M40 0H0V40" className="scene-grid" fill="none" />
            <circle r="1" cx="0" cy="0" className="grid-dot" />
          </pattern>
          <linearGradient id={uid + "water"} x1="0" x2="1" y1="0" y2="1">
            <stop className="water-start" />
            <stop offset=".5" className="water-mid" />
            <stop offset="1" className="water-end" />
          </linearGradient>
          <radialGradient id={uid + "aura"}>
            <stop stopColor="currentColor" stopOpacity=".14" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
          <filter
            id={uid + "glow"}
            x="-100%"
            y="-100%"
            width="300%"
            height="300%"
          >
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <rect width="800" height="800" className="scene-bg" />
        <rect width="800" height="800" fill={ref("grid")} />
        <circle
          cx="420"
          cy="380"
          r="440"
          fill={ref("aura")}
          className="scene-aura"
        />
        <g
          className="scene-world"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "400px 400px",
          }}
        >
          <g className="topo-lines">
            {Array.from({ length: 13 }, (_, i) => (
              <path
                key={i}
                d={`M${-180 + i * 21} -30 Q${320 + i * 13} 130 ${80 + i * 21} 370 T${-40 + i * 25} 850`}
                fill="none"
              />
            ))}
            {Array.from({ length: 10 }, (_, i) => (
              <path
                key={i}
                d={`M${520 + i * 20} -30 Q${880 + i * 18} 180 ${680 + i * 15} 440 T${600 + i * 25} 850`}
                fill="none"
              />
            ))}
          </g>
          <g className="terrain-islands">
            <path d="M80 170Q190 130 210 240T95 365Q25 295 80 170Z" />
            <path d="M620 380Q720 320 760 430T680 600Q580 510 620 380Z" />
          </g>
          <path d={river} className="river-aura" />
          <path d={river} className="river-edge" />
          <path d={river} stroke={ref("water")} className="river-surface" />
          <path d={river} className="river-current" />
          <g className="sandbars">
            <path d="M455 437Q516 447 530 486L499 511Q510 474 455 437Z" />
            <path d="M348 253Q389 238 418 257L401 272Z" />
          </g>
          {route && (
            <g className="flight-layer">
              <path
                d="M533 40L360 240L548 448L280 625L310 755"
                className="flight-trail"
              />
              <g className="drone">
                <animateMotion
                  dur="18s"
                  repeatCount="indefinite"
                  path="M533 40L360 240L548 448L280 625L310 755"
                  rotate="auto"
                />
                <circle r="17" />
                <path d="M-9 -9L9 9M-9 9L9 -9M-4 0H4" />
                <circle cx="-9" cy="-9" r="4" />
                <circle cx="9" cy="9" r="4" />
                <circle cx="9" cy="-9" r="4" />
                <circle cx="-9" cy="9" r="4" />
              </g>
            </g>
          )}
          {stage > 0 &&
            overlay &&
            points.map((p, i) => (
              <g
                key={p.id}
                transform={`translate(${p.x} ${p.y})`}
                className={
                  "scene-object " +
                  (i === selected ? "is-selected" : "") +
                  " " +
                  (i === 1 ? "on-shoal" : "in-water")
                }
              >
                <g className="object-mask">
                  <path d="M-27 -18L8 -28L32 -8L24 23L-18 29L-33 10Z" />
                  <path
                    d="M-19 -7L20 12M-12 14L17 -15M-24 5L8 19"
                    className="timber"
                  />
                </g>
                {i === selected && (
                  <>
                    <path
                      className="target-corner"
                      d="M-43 -25V-40H-27M27 -40H43V-25M43 25V40H27M-27 40H-43V25"
                    />
                    <circle className="object-pulse" r="45" />
                  </>
                )}
                <g
                  role="button"
                  tabIndex="0"
                  aria-label={"Показать завал " + p.id}
                  aria-pressed={i === selected}
                  onClick={() => onSelect(i)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(i);
                    }
                  }}
                  className="map-marker"
                >
                  <circle className="marker-hit" r="43" />
                  <circle className="marker-ring" r="24" />
                  <circle className="marker-core" r="17" />
                  <text textAnchor="middle" dy="4">
                    {p.id}
                  </text>
                  <title>
                    Завал {p.id} · {p.kind}
                  </title>
                </g>
                <g transform="translate(38 -27)" className="object-label">
                  <rect width="130" height="46" rx="6" />
                  <text x="12" y="18">
                    ОБЪЕКТ {p.id}
                  </text>
                  <text x="12" y="34" className="object-label-value">
                    {p.kind} · {p.score}%
                  </text>
                </g>
              </g>
            ))}
          <g className="scene-geo">
            <text x="80" y="110">
              47° 02′ N
            </text>
            <text x="580" y="720">
              142° 44′ E
            </text>
            <path d="M70 120H130M70 120V180M730 680H670M730 680V620" />
          </g>
        </g>
      </svg>
      <div className="scene-toolbar">
        <span className="scene-mode">
          <i />
          {interactive
            ? "ИНТЕРАКТИВНОЕ ОБСЛЕДОВАНИЕ"
            : "RIVER / GEO INTELLIGENCE"}
        </span>
        <span className="scene-north">
          <Navigation size={15} /> N
        </span>
      </div>
      <div className="scene-caption">
        <span>
          РЕЧНОЙ УЧАСТОК <b>СХЕМА 01</b>
        </span>
        <span className="scene-live">ДЕМО-СЦЕНАРИЙ</span>
      </div>
      {interactive && (
        <div className="scene-controls">
          <button
            onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))}
            aria-label="Приблизить"
          >
            <Plus size={17} />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.8, z - 0.2))}
            aria-label="Отдалить"
          >
            <Minus size={17} />
          </button>
          <button onClick={() => setZoom(1)} aria-label="Сбросить масштаб">
            <RotateCcw size={15} />
          </button>
          <span />
          <button
            className={overlay ? "is-on" : ""}
            onClick={() => setOverlay((v) => !v)}
            aria-label="Переключить слой обнаружений"
            aria-pressed={overlay}
          >
            <Layers size={17} />
          </button>
          <button
            className={route ? "is-on" : ""}
            onClick={() => setRoute((v) => !v)}
            aria-label="Траектория полёта"
            aria-pressed={route}
          >
            <Route size={17} />
          </button>
        </div>
      )}
      <div className="scene-legend">
        <span>
          <i /> В воде
        </span>
        <span>
          <i /> На отмели
        </span>
        <span className="legend-route">┄ Траектория БПЛА</span>
      </div>
      {!interactive && (
        <div className="scene-summary">
          <div className="summary-icon">
            <ScanLine size={23} />
          </div>
          <div>
            <small>ПРОСТРАНСТВЕННЫЙ АНАЛИЗ</small>
            <strong>От наблюдения — к пониманию.</strong>
          </div>
          <span>
            03<small>ОБЪЕКТА</small>
          </span>
        </div>
      )}
      {interactive && (
        <span className="scene-scale">
          УСЛОВНЫЕ ДАННЫЕ <b>╞════╡</b>
        </span>
      )}
    </div>
  );
}
