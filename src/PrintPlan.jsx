import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, X } from "lucide-react";
import { createPlanPdf, makePlanDocument } from "./lib/plan-document.js";
import "./styles/plan-paper.css";

function PlanPaper({ sheet }) {
  return (
    <article className="plan-paper">
      <div className="paper-brand">
        RIVER <span>{sheet.label}</span>
      </div>
      <h1>{sheet.title}</h1>
      <p className="paper-warning">{sheet.source}</p>
      <dl className="paper-details">
        {sheet.details.map(({ label, value }) => (
          <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
        ))}
      </dl>
      <div className="paper-totals">
        <span><b>{sheet.objects.length}</b> объектов к устранению</span>
      </div>
      <h2>Объекты в плане</h2>
      {sheet.objects.map((object) => (
        <section className="paper-object" key={object.id}>
          <h3>{object.title}</h3>
          <p>{object.section}</p>
          <p>{object.coordinates}</p>
          {object.note && <div className="paper-note"><b>Заметка</b><p>{object.note}</p></div>}
        </section>
      ))}
      <h2>Перед выездом</h2>
      <ul className="paper-checklist">
        {sheet.checklist.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <footer>{sheet.footer}</footer>
    </article>
  );
}

export default function PrintPlan({ plan, onClose }) {
  const preview = useRef(null);
  const [status, setStatus] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const [sheet] = useState(() => makePlanDocument(plan));

  useLayoutEffect(() => {
    document.body.classList.add("has-print-plan");
    preview.current.focus({ preventScroll: true });
    preview.current.scrollIntoView({ block: "start" });
    return () => document.body.classList.remove("has-print-plan");
  }, []);

  useEffect(() => {
    let disposed = false;
    let url;
    async function prepare() {
      try {
        const pdf = await createPlanPdf(sheet).getBlob();
        if (disposed) return;
        url = URL.createObjectURL(pdf);
        setPdfUrl(url);
      } catch {
        if (!disposed) setPdfError(true);
      }
    }
    prepare();
    return () => {
      disposed = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [sheet]);

  function print() {
    try {
      window.print();
      setStatus("");
    } catch {
      setStatus("Браузер не запустил печать. Воспользуйтесь кнопкой «Скачать PDF».");
    }
  }

  return (
    <>
      <section ref={preview} id="print-plan-preview" className="print-plan-preview" tabIndex={-1}
        aria-label="Предпросмотр печатного плана" onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onClose();
          }
        }}>
        <div className="print-toolbar">
          <span>Предпросмотр документа</span>
          <button type="button" onClick={print}><Printer size={16} /> Печать</button>
          {pdfUrl ? (
            <a href={pdfUrl} download="RIVER_removal_plan.pdf"><Download size={16} /> Скачать PDF</a>
          ) : (
            <button type="button" disabled><Download size={16} /> {pdfError ? "PDF недоступен" : "Готовим PDF…"}</button>
          )}
          <button type="button" onClick={onClose} aria-label="Закрыть предпросмотр"><X size={20} /></button>
        </div>
        {status && <p className="print-status" role="status">{status}</p>}
        <PlanPaper sheet={sheet} />
      </section>
      {createPortal(
        <div className="print-plan-output" aria-hidden="true">
          <PlanPaper sheet={sheet} />
        </div>,
        document.body,
      )}
    </>
  );
}
