import React from "react";
import { FiFolder, FiCheckSquare, FiUser } from "react-icons/fi";
import { formatDate } from "../../utils/formatDate";

const STATUS_BADGE = {
  Draft: "Draft",
  Submitted: "Submitted",
  "Under Review": "Under Review",
  Approved: "Approved",
  Rejected: "Rejected",
  "Needs Revision": "Needs Revision",
};

export default function RCAList({ rcas = [], onSelect, showProject = true }) {
  if (rcas.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "40px 20px", textAlign: "center", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
        <h3>No RCA reports found</h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>There are no reports logged matching the active criteria.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {rcas.map((rca) => (
        <div
          key={rca._id}
          className="rca-card"
          style={{
            cursor: "pointer",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            transition: "transform 0.2s, border-color 0.2s",
            position: "relative",
            animation: "fadeIn 0.2s ease",
          }}
          onClick={() => onSelect(rca)}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--color-primary)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
            e.currentTarget.style.transform = "none";
          }}
        >
          {/* Status strip */}
          <div className={`rca-status-indicator ${rca.status}`} />

          <div className="rca-card-content">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
              <h3 className="rca-card-title" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{rca.title}</h3>
              <span className={`rca-status-badge ${rca.status?.toLowerCase().replace(/\s+/g, "-")}`}>
                {STATUS_BADGE[rca.status] || rca.status}
              </span>
            </div>

            <p className="rca-card-excerpt" style={{ color: "var(--color-text-secondary)", fontSize: 14, margin: "0 0 16px 0", lineHeight: "1.5" }}>
              {rca.incidentDescription?.length > 180 ? `${rca.incidentDescription.slice(0, 180)}...` : rca.incidentDescription}
            </p>

            <div className="rca-card-meta" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", fontSize: 12, color: "var(--color-text-muted)" }}>
              {showProject && rca.project && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FiFolder />
                  <span>Project: <strong>{rca.project.name}</strong></span>
                </div>
              )}
              {rca.task && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <FiCheckSquare />
                  <span>Task: <strong>{rca.task.title}</strong></span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <FiUser />
                <span>Submitted by: <strong>{rca.submitter?.name}</strong></span>
              </div>
              <div style={{ marginLeft: "auto" }}>
                {formatDate(rca.createdAt)}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
