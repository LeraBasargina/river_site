import React, { useState, useRef, useEffect } from "react";
import {
  ScanLine,
  Eye,
  RotateCcw,
  Undo2,
  ArrowRight,
  ArrowLeft,
  Check,
  Maximize2,
  X,
  MousePointer2,
} from "lucide-react";
const photoViews = [12, 36, 52].map((time) => ({
  id: `flight-${time}`,
  title: `Облёт · 00:${time}`,
  detail: "Оригинальное видео · PNG",
  original: `/media/spotter/flight-${time}-original.png`,
  result: `/media/spotter/flight-${time}-result.png`,
  scale: 1,
  origin: "50% 50%",
  width: time === 12 ? 1400 : time === 36 ? 930 : 1050,
  ratio: time === 12 ? "1400 / 680" : time === 36 ? "930 / 520" : "1050 / 340",
}));
const newSession = () => ({
  marks: [],
  revealed: false,
  cursor: { x: 50, y: 50 },
  message: "",
});
const frames = [
  { time: 20, x: 40.5, y: 34.5 },
  { time: 22, x: 42.2, y: 39.3 },
  { time: 24, x: 47.5, y: 49 },
];
const steps = [
  {
    title: "Три наблюдения",
    text: "Дрон движется. Один и тот же ориентир у правого берега меняет положение и масштаб в кадре.",
  },
  {
    title: "Связать между кадрами",
    text: "Сравните форму древесного скопления и соседний берег. Выделенные окна указывают на один визуально прослеживаемый ориентир.",
  },
  {
    title: "Один объект для анализа",
    text: "В учебном примере три наблюдения объединены в одну карточку. Повторное появление в видео не означает новый завал.",
  },
];
function FrameDialog({ frame, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="frame-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-label={"Кадр 00:" + frame.time}
    >
      <div className="frame-dialog-head">
        <span>РЕАЛЬНЫЙ КАДР · 00:{frame.time}</span>
        <button onClick={onClose} aria-label="Закрыть кадр">
          <X size={20} />
        </button>
      </div>
      <div className="tracking-photo">
        <img
          src={"/media/track-" + frame.time + ".jpg"}
          alt={"Кадр с дрона на " + frame.time + " секунде"}
        />
        <span
          className="track-focus"
          style={{ left: frame.x + "%", top: frame.y + "%" }}
        />
      </div>
      <p>
        Рамка интерфейса указывает на выбранный ориентир. Зелёные маски уже
        присутствуют в исходной записи результатов обработки.
      </p>
    </dialog>
  );
}
export default function FieldLab() {
  const [activeView, setActiveView] = useState(0);
  const [sessions, setSessions] = useState({});
  const [step, setStep] = useState(0);
  const [frame, setFrame] = useState(null);
  const view = photoViews[activeView];
  const { marks, revealed, cursor, message } =
    sessions[view.id] || newSession();
  function updateSession(field, value) {
    setSessions((all) => {
      const current = all[view.id] || newSession();
      return {
        ...all,
        [view.id]: {
          ...current,
          [field]: typeof value === "function" ? value(current[field]) : value,
        },
      };
    });
  }
  const setMarks = (value) => updateSession("marks", value);
  const setRevealed = (value) => updateSession("revealed", value);
  const setCursor = (value) => updateSession("cursor", value);
  const setMessage = (value) => updateSession("message", value);
  const photoStyle = {
    transform: `scale(${view.scale})`,
    transformOrigin: view.origin,
  };
  const image = useRef(null);
  function add(x, y) {
    if (revealed) return;
    if (marks.length >= 6) {
      setMessage(
        "Можно поставить до шести отметок. Удалите лишнюю или откройте результат.",
      );
      return;
    }
    setMarks((v) => [...v, { x, y, id: Date.now() + Math.random() }]);
    setMessage("Отметка добавлена. Нажмите на её номер, чтобы удалить.");
  }
  function reset() {
    setMarks([]);
    setRevealed(false);
    setMessage("Начните снова: отметьте древесные скопления на снимке.");
  }
  return (
    <section className="field-lab section" id="field-lab">
      <div className="section-kicker">
        ПОЛЕВАЯ ЛАБОРАТОРИЯ / ПОПРОБУЙТЕ САМИ
      </div>
      <div className="section-heading">
        <h2>
          Сначала ваш взгляд.
          <br />
          <span>Потом — взгляд модели.</span>
        </h2>
        <p>
          Настоящий кадр с дрона.
          <br />
          Какие места вы бы проверили внимательнее?
        </p>
      </div>
      <div
        className="spotter-gallery video-only-gallery"
        role="group"
        aria-label="Выбор снимка для поиска завалов"
      >
        {photoViews.map((sample, i) => (
          <button
            key={sample.id}
            className={i === activeView ? "active" : ""}
            aria-pressed={i === activeView}
            onClick={() => setActiveView(i)}
          >
            <span className="spotter-thumb">
              <img
                src={sample.original}
                loading="lazy"
                decoding="async"
                alt=""
                style={{
                  transform: `scale(${sample.scale})`,
                  transformOrigin: sample.origin,
                }}
              />
            </span>
            <span>
              <strong>{sample.title}</strong>
              <small>{sample.detail}</small>
            </span>
            <span className="sample-status">
              {sessions[sample.id]?.revealed ? "Маски открыты" : `0${i + 1}`}
            </span>
          </button>
        ))}
      </div>
      <p className="spotter-gallery-note">
        Три фрагмента реального облёта: 00:12, 00:36 и 00:52. В каждом задании
        одинаковая область синхронных кадров b-box и segment. До проверки
        показан фрагмент без видимых рамок, после — сохранённые маски модели.
        Отметки каждого кадра сохраняются отдельно до перезагрузки страницы.
      </p>
      <div className="spotter-panel">
        <div className="spotter-main">
          <div className="spotter-top">
            <span>
              <i /> {view.title.toUpperCase()} / {activeView + 1} ИЗ{" "}
              {photoViews.length}
            </span>
            <span>{revealed ? "РЕЗУЛЬТАТ ОТКРЫТ" : "ВАША ОЧЕРЕДЬ"}</span>
          </div>
          <div
            ref={image}
            key={view.id}
            style={{
              aspectRatio: view.ratio || "16 / 9",
              maxWidth: view.width,
              marginInline: "auto",
            }}
            className={"spotter-image " + (revealed ? "is-revealed" : "")}
            role="button"
            tabIndex={revealed ? -1 : 0}
            aria-label="Снимок для поиска завалов. Стрелки перемещают прицел, Enter добавляет отметку."
            aria-disabled={revealed}
            onClick={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              add(
                ((e.clientX - r.left) / r.width) * 100,
                ((e.clientY - r.top) / r.height) * 100,
              );
            }}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              if (
                ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
                  e.key,
                )
              ) {
                e.preventDefault();
                setCursor((c) => ({
                  x: Math.max(
                    1,
                    Math.min(
                      99,
                      c.x +
                        (e.key === "ArrowRight"
                          ? 2
                          : e.key === "ArrowLeft"
                            ? -2
                            : 0),
                    ),
                  ),
                  y: Math.max(
                    1,
                    Math.min(
                      99,
                      c.y +
                        (e.key === "ArrowDown"
                          ? 2
                          : e.key === "ArrowUp"
                            ? -2
                            : 0),
                    ),
                  ),
                }));
              } else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                add(cursor.x, cursor.y);
              }
            }}
          >
            <img
              src={view.original}
              style={photoStyle}
              alt={view.title + ": исходная аэросъёмка речного участка"}
              draggable="false"
            />
            {revealed && view.result && (
              <img
                className="spotter-mask"
                style={photoStyle}
                src={view.result}
                alt="Результат сегментации из материалов проекта"
              />
            )}
            {marks.map((m, i) => (
              <button
                className="user-mark"
                key={m.id}
                style={{ left: m.x + "%", top: m.y + "%" }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!revealed) {
                    setMarks((v) => v.filter((x) => x.id !== m.id));
                    setMessage("Отметка удалена.");
                  }
                }}
                aria-label={"Удалить отметку " + (i + 1)}
                disabled={revealed}
              >
                {i + 1}
              </button>
            ))}
            {!revealed && (
              <span
                className="keyboard-crosshair"
                style={{ left: cursor.x + "%", top: cursor.y + "%" }}
                aria-hidden="true"
              >
                +
              </span>
            )}
            <span className="photo-credit">
              МАТЕРИАЛЫ ПРОЕКТА RIVER ·{" "}
              {view.id.startsWith("dji-") ? "DJI" : "AI_CENTER_SITE"}
            </span>
          </div>
          <div className="spotter-legend">
            <span>
              <i /> Ваши отметки: {marks.length}
            </span>
            {revealed ? (
              <span>
                <i /> Зелёные области — маски модели
              </span>
            ) : (
              <span>Нажмите на снимок или используйте клавиатуру</span>
            )}
          </div>
        </div>
        <aside className="spotter-side">
          <span className="lab-kicker">01 / НАЙТИ ЗАВАЛ · {view.title}</span>
          <h3>{revealed ? "Сравните два взгляда." : "Что скрывает берег?"}</h3>
          <p>
            {revealed
              ? "Синие метки — ваш выбор. Зелёные контуры — результат модели на этом кадре. Посмотрите, какие области совпали и что осталось без внимания."
              : view.result
                ? "Отметьте подозрительные древесные скопления. Затем откройте результат и сравните свои наблюдения с сегментацией."
                : "Новый исходный снимок. Отметьте подозрительные древесные скопления. Результат модели для этого кадра ещё не предоставлен."}
          </p>
          <div className="spotter-instruction">
            <MousePointer2 size={19} />
            <span>
              {revealed
                ? "Разметка помогает увидеть границы. Оценка специалиста остаётся важной."
                : "Можно поставить до шести отметок. Нажатие на номер удаляет отметку."}
            </span>
          </div>
          {!revealed ? (
            <>
              <button
                className="button primary"
                disabled={!view.result}
                onClick={() => {
                  if (!view.result) return;
                  setRevealed(true);
                  setMessage(
                    "Результат сегментации открыт. Сравните выделенные области со своими наблюдениями.",
                  );
                }}
              >
                <Eye size={16} />{" "}
                {!view.result
                  ? "Результат модели ожидается"
                  : marks.length
                    ? "Показать взгляд модели"
                    : "Посмотреть без отметок"}
              </button>
              <button
                className="lab-text-button"
                disabled={!marks.length}
                onClick={() => {
                  setMarks((v) => v.slice(0, -1));
                  setMessage("Последняя отметка удалена.");
                }}
              >
                <Undo2 size={14} /> Отменить последнюю
              </button>
            </>
          ) : (
            <button className="button primary" onClick={reset}>
              <RotateCcw size={15} /> Попробовать ещё раз
            </button>
          )}
          {!view.result && (
            <p className="spotter-unavailable">
              Маски из другого снимка не накладываются. Для проверки нужен
              результат обработки именно этого кадра.
            </p>
          )}
          <p className="lab-feedback" role="status">
            {message}
          </p>
          <small>
            Это наблюдение, а не тест точности. Баллы не начисляются: экспертной
            эталонной разметки для оценки здесь нет. Новая обработка изображения
            не запускается.
          </small>
        </aside>
      </div>
      <div className="tracking-heading">
        <div>
          <div className="section-kicker">02 / МНОГО КАДРОВ — ОДИН ОБЪЕКТ</div>
          <h2>
            Ракурс меняется.
            <br />
            <span>Объект остаётся.</span>
          </h2>
        </div>
        <p>
          Три кадра одной записи с интервалом в две секунды.
          <br />
          Проследите древесное скопление у правого берега.
        </p>
      </div>
      <div className="tracking-panel">
        <div
          className="tracking-steps"
          role="tablist"
          aria-label="Этапы объединения наблюдений"
        >
          {steps.map((s, i) => (
            <button
              key={s.title}
              role="tab"
              aria-selected={step === i}
              onClick={() => setStep(i)}
            >
              <span>0{i + 1}</span>
              {s.title}
              {step > i && <Check size={14} />}
            </button>
          ))}
        </div>
        <div className={"tracking-frames stage-" + step}>
          {frames.map((f, i) => (
            <button
              className="tracking-frame"
              key={f.time}
              onClick={() => setFrame(f)}
              aria-label={"Открыть кадр 00:" + f.time}
            >
              <div className="tracking-photo">
                <img
                  src={"/media/track-" + f.time + ".jpg"}
                  alt={"Речное обследование на " + f.time + " секунде"}
                />
                {step > 0 && (
                  <span
                    className="track-focus"
                    style={{ left: f.x + "%", top: f.y + "%" }}
                  />
                )}
                <span className="frame-expand">
                  <Maximize2 size={15} />
                </span>
              </div>
              <div className="tracking-frame-caption">
                <span>00:{f.time}</span>
                <b>Наблюдение 0{i + 1}</b>
              </div>
            </button>
          ))}
        </div>
        <div className="tracking-explanation">
          <div className="tracking-step-copy">
            <span className="lab-kicker">ШАГ 0{step + 1}</span>
            <h3>{steps[step].title}</h3>
            <p>{steps[step].text}</p>
          </div>
          <div
            className={"observation-merge " + (step === 2 ? "merged" : "")}
            aria-label="Три наблюдения одного ориентира"
          >
            <div className="merge-inputs">
              <span>00:20</span>
              <span>00:22</span>
              <span>00:24</span>
            </div>
            <div className="merge-connector">→</div>
            <div className="merge-output">
              <ScanLine size={23} />
              <strong>{step === 2 ? "T-01" : "?"}</strong>
              <small>
                {step === 2 ? "Один учебный объект" : "Сопоставление"}
              </small>
            </div>
          </div>
        </div>
        <div className="tracking-bottom">
          <p>
            Ориентир сопоставлен визуально для объяснения принципа. T-01 —
            учебное обозначение, не подтверждённый ID трекера. Полный журнал
            трекинга не предоставлен.
          </p>
          <div>
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              aria-label="Предыдущий шаг объединения"
            >
              <ArrowLeft size={16} />
            </button>
            <button onClick={() => setStep((s) => (s === 2 ? 0 : s + 1))}>
              {step === 2 ? (
                <>
                  <RotateCcw size={14} /> Сначала
                </>
              ) : (
                <>
                  Следующий шаг <ArrowRight size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      {frame && <FrameDialog frame={frame} onClose={() => setFrame(null)} />}
    </section>
  );
}
