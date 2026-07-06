import React, { useState } from "react";
import { FiDownload } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ExportButton({ onExport, label = "Export data", type = "secondary" }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      await onExport();
    } catch (err) {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      className={`btn ${type === "primary" ? "btn-primary" : "btn-secondary"}`}
      style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40 }}
      onClick={handleExport}
      disabled={exporting}
    >
      <FiDownload size={14} style={{ animation: exporting ? "spin 1.5s linear infinite" : "none" }} />
      <span>{exporting ? "Exporting..." : label}</span>
    </button>
  );
}
