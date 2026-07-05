import React from "react";
import { FiFile, FiTrash2, FiDownload } from "react-icons/fi";

export default function FilePreview({ attachments = [], onDelete, currentUserId, isAdmin }) {
  const getFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
    const serverHost = apiBase.replace("/api/v1", "");
    return `${serverHost}${url}`;
  };

  const formatSize = (bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (attachments.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "var(--color-text-muted)", margin: 0, textAlign: "center", padding: "10px 0" }}>
        No evidence files attached.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {attachments.map((file) => {
        const canDelete = isAdmin || file.uploader === currentUserId || file.uploader?._id === currentUserId;
        return (
          <div
            key={file._id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "var(--color-surface-hover)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden", marginRight: 10 }}>
              <FiFile style={{ color: "var(--color-primary-hover)", flexShrink: 0 }} size={16} />
              <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <a
                  href={getFileUrl(file.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text)", textDecoration: "none" }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = "underline"}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = "none"}
                >
                  {file.filename}
                </a>
                <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 }}>
                  {formatSize(file.fileSize)}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <a
                href={getFileUrl(file.url)}
                download
                className="btn btn-ghost"
                style={{ padding: 6, display: "flex", color: "var(--color-text-secondary)" }}
                title="Download"
              >
                <FiDownload size={14} />
              </a>
              {canDelete && (
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{ padding: 6, display: "flex", color: "var(--color-danger)" }}
                  onClick={() => onDelete(file._id)}
                  title="Delete"
                >
                  <FiTrash2 size={14} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
