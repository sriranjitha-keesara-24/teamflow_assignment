import React, { useRef } from "react";
import { FiUpload, FiLoader } from "react-icons/fi";

export default function FileUpload({ onUpload, isUploading }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
      // Reset input value to allow uploading same file again
      e.target.value = null;
    }
  };

  return (
    <div style={{ border: "2px dashed var(--color-border)", borderRadius: "var(--radius-md)", padding: 20, textAlign: "center", background: "var(--color-surface-hover)" }}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <button
        type="button"
        className="btn btn-secondary"
        style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <>
            <FiLoader className="spinner" />
            Uploading...
          </>
        ) : (
          <>
            <FiUpload />
            Select Evidence File
          </>
        )}
      </button>
      <p style={{ margin: "10px 0 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
        Supported file formats: images, PDFs, word, spreadsheets, text, CSV (Max 10MB)
      </p>
    </div>
  );
}
