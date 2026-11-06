import React, { useState, useRef, useEffect } from "react";
import {
  ScanLine,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Check,
  Maximize2,
  X,
} from "lucide-react";
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
export default function TrackingDemo() {
  const [step, setStep] = useState(0);
  const [frame, setFrame] = useState(null);
  return (
    <section id="tracking-demo" className="tracking-demo section">
      <div className="tracking-heading">
        <div>
          <div className="section-kicker">МНОГО КАДРОВ — ОДИН ОБЪЕКТ</div>
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
