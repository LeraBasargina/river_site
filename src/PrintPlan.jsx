import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Printer, X } from "lucide-react";
export default function PrintPlan({ plan, onClose }) {
  const dialog = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    dialog.current.showModal();
    return () => previous?.focus();
  }, []);
  const date = new Date(plan.date + "T12:00:00").toLocaleDateString("ru-RU");
  return createPortal(
    <div className="print-plan-host">
      <dialog
        ref={dialog}
        className="print-plan-dialog"
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        aria-labelledby="print-plan-title"
      >
        <div className="print-toolbar">
          <span>Предпросмотр документа</span>
          <button onClick={() => window.print()}>
            <Printer size={16} /> Печать / сохранить PDF
          </button>
          <button onClick={onClose} aria-label="Закрыть предпросмотр">
            <X size={20} />
          </button>
        </div>
        <article className="plan-paper">
          <div className="paper-brand">
            RIVER <span>ПОЛЕВОЙ ПЛАН / УЧЕБНЫЙ СЦЕНАРИЙ</span>
          </div>
          <h1 id="print-plan-title">План выезда</h1>
          <p className="paper-warning">
            Демонстрационный документ. Не является заданием на реальные работы.
            Участки, расстояния, приоритеты и число завалов условные.
          </p>
          <dl className="paper-details">
            <div>
              <dt>Дата выезда</dt>
              <dd>{date}</dd>
            </div>
            <div>
              <dt>Бригада</dt>
              <dd>{plan.team}</dd>
            </div>
            <div>
              <dt>Задача</dt>
              <dd>{plan.task}</dd>
            </div>
            <div>
              <dt>Маршрут по течению</dt>
              <dd>{plan.chosen.map((r) => r.id).join(" → ")}</dd>
            </div>
          </dl>
          <div className="paper-totals">
            <span>
              <b>{plan.chosen.length}</b> участков
            </span>
            <span>
              <b>{plan.sum}</b> км по схеме
            </span>
            <span>
              <b>{plan.chosen.reduce((s, r) => s + r.jams, 0)}</b> завалов
            </span>
          </div>
          <h2>Участки и наблюдения</h2>
          {plan.chosen.map((r, i) => (
            <section className="paper-reach" key={r.id}>
              <h3>
                {i + 1}. Участок {r.id} — {r.name}
              </h3>
              <p>
                {r.km} км · Завалов: {r.jams} · Приоритет:{" "}
                {r.priority.toLowerCase()}
              </p>
              <p>
                <b>Статус:</b> {plan.observations[r.id]?.status || "Не задан"}
              </p>
              <div className="paper-note">
                <b>Заметка:</b>
                <p>
                  {plan.observations[r.id]?.note ||
                    "Нет заметки. Уточнить условия на месте."}
                </p>
              </div>
            </section>
          ))}
          <h2>Перед выездом</h2>
          <ul className="paper-checklist">
            <li>Согласовать необходимость и объём работ со специалистом.</li>
            <li>Уточнить реальные координаты, подъезды и доступ к берегу.</li>
            <li>Проверить условия безопасности и состав оборудования.</li>
          </ul>
          <footer>
            Сформировано из текущих полей планировщика RIVER. Координаты и точки
            доступа в документ не включены: подтверждённых данных нет.
          </footer>
        </article>
      </dialog>
    </div>,
    document.body,
  );
}
