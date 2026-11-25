import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Printer, X } from "lucide-react";
import { createPlanPdf, makePlanDocument } from "./lib/plan-document.js";
import "./styles/plan-paper.css";
import paperStyles from "./styles/plan-paper.css?raw";

export default function PrintPlan({ plan, onClose }) {
  const dialog = useRef(null);
  const paper = useRef(null);
  const [status, setStatus] = useState("");
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfError, setPdfError] = useState(false);
  const [sheet] = useState(() => makePlanDocument(plan));

  useEffect(() => {
    dialog.current.showModal();
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
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setStatus("Браузер заблокировал окно печати. Воспользуйтесь кнопкой «Скачать PDF».");
      return;
    }

    setStatus("");
    const doc = printWindow.document;
    doc.title = sheet.title;
    doc.documentElement.lang = "ru";
    printWindow.opener = null;
    const styles = doc.createElement("style");
    styles.textContent = paperStyles + `
      body { margin: 0; background: white; color: #183c4b; }
      .print-standalone-toolbar { padding: 14px 24px; font: 14px Arial, sans-serif; border-bottom: 1px solid #d5e0e4; }
    `;
    doc.head.append(styles);
    const tools = doc.createElement("div");
    tools.className = "print-standalone-toolbar";
    const button = doc.createElement("button");
    button.textContent = "Печать";
    button.addEventListener("click", () => printWindow.print());
    tools.append(button);
    doc.body.append(tools, doc.importNode(paper.current, true));
    printWindow.focus();
    try {
      printWindow.print();
    } catch {
      setStatus("Не удалось запустить печать. Нажмите «Печать» в новой вкладке или скачайте PDF.");
    }
  }

  return createPortal(
    <dialog ref={dialog} className="print-plan-dialog" onClose={onClose} aria-labelledby="print-plan-title">
      <div className="print-toolbar">
        <span>Предпросмотр документа</span>
        <button type="button" onClick={print}><Printer size={16} /> Печать</button>
        {pdfUrl ? (
          <a href={pdfUrl} download="RIVER_removal_plan.pdf"><Download size={16} /> Скачать PDF</a>
        ) : (
          <button type="button" disabled><Download size={16} /> {pdfError ? "PDF недоступен" : "Готовим PDF…"}</button>
        )}
        <button type="button" onClick={() => dialog.current.close()} aria-label="Закрыть предпросмотр"><X size={20} /></button>
      </div>
      {status && <p className="print-status" role="status">{status}</p>}
      <article className="plan-paper" ref={paper}>
        <div className="paper-brand">
          RIVER <span>{sheet.label}</span>
        </div>
        <h1 id="print-plan-title">{sheet.title}</h1>
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
    </dialog>,
    document.body,
  );
}
