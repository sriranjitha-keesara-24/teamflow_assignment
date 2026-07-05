import React from "react";
import { FiX } from "react-icons/fi";

export default function Modal({ isOpen, onClose, title, children, size = "md" }) {
  if (!isOpen) return null;

  const maxWidths = {
    sm: "400px",
    md: "600px",
    lg: "800px",
    xl: "1000px",
  };

  return (
    <div className="modal-overlay" style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: maxWidths[size] || "600px",
          width: "95%",
          maxHeight: "90vh",
          overflowY: "auto",
          position: "relative",
          animation: "fadeIn 0.2s ease",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-lg)",
          padding: 24,
        }}
      >
        <div className="modal-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-muted)", cursor: "pointer" }}>
            <FiX size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
