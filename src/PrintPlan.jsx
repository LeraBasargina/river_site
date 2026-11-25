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
          <h1 id="print-plan-title">План устранения завалов</h1>
          <p className="paper-warning">
            План по материалам обследования Лютоги от 2 июля 2025 года.
            Включены объекты, выбранные специалистом при проверке.
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
              <dd>Устранение выбранных древесных завалов</dd>
            </div>
          </dl>
          <div className="paper-totals">
            <span>
              <b>{plan.chosen.length}</b> объектов к устранению
            </span>
          </div>
          <h2>Объекты в плане</h2>
          {plan.chosen.map((object) => (
            <section className="paper-object" key={object.id}>
              <h3>Объект №{object.id} · {object.category}</h3>
              <p>Участок {object.section_id} · {object.section}</p>
              <p>Расчётные координаты · {object.lat.toFixed(7)}, {object.lon.toFixed(7)}</p>
              {object.note && (
                <div className="paper-note">
                  <b>Заметка</b>
                  <p>{object.note}</p>
                </div>
              )}
            </section>
          ))}
          <h2>Перед выездом</h2>
          <ul className="paper-checklist">
            <li>Согласовать необходимость и объём работ со специалистом.</li>
            <li>Уточнить реальные координаты, подъезды и доступ к берегу.</li>
            <li>Проверить условия безопасности и состав оборудования.</li>
          </ul>
          <footer>
            Сформировано в планировщике RIVER. Перед полевыми работами
            подтвердите координаты объектов и условия доступа.
          </footer>
        </article>
      </dialog>
    </div>,
    document.body,
  );
}
