import React, { useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";
import "./styles/image-viewer.css";

export default function ImageViewer({ title, children, onClose }) {
  const dialog = useRef(null);

  useLayoutEffect(() => {
    dialog.current.showModal();
  }, []);

  return (
    <dialog ref={dialog} className="image-viewer" aria-label={title} onClose={onClose}>
      <div className="image-viewer-head">
        <h3>{title}</h3>
        <button type="button" onClick={() => dialog.current.close()}>
          <X size={18} aria-hidden="true" /> Закрыть
        </button>
      </div>
      {children}
    </dialog>
  );
}
