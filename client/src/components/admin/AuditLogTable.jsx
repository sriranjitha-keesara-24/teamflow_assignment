import React, { useState } from "react";
import { FiSearch, FiSliders, FiClock } from "react-icons/fi";

export default function AuditLogTable({ logs }) {
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderDetails = (details) => {
    if (!details) return "N/A";
    if (typeof details === "string") return details;
    if (typeof details === "object") {
      if (details.title) return `Task: "${details.title}"`;
      if (details.projectName) return `Project: "${details.projectName}"`;
      if (details.from !== undefined && details.to !== undefined) {
        return `Status changed from "${details.from}" to "${details.to}"`;
      }
      if (details.fields && Array.isArray(details.fields)) {
        return `Updated fields: ${details.fields.join(", ")}`;
      }
      return JSON.stringify(details);
    }
    return String(details);
  };

  const filteredLogs = logs.filter((log) => {
    const detailsStr = log.details ? renderDetails(log.details) : "";
    const matchesSearch =
      (log.action && log.action.toLowerCase().includes(search.toLowerCase())) ||
      detailsStr.toLowerCase().includes(search.toLowerCase()) ||
      (log.user && log.user.name && log.user.name.toLowerCase().includes(search.toLowerCase()));

    const matchesEntity = entityFilter === "all" || log.entity === entityFilter;

    return matchesSearch && matchesEntity;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Search action, user, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", paddingLeft: 36, height: 40 }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <FiSliders style={{ color: "var(--color-text-secondary)" }} />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            style={{ height: 40, padding: "0 10px", minWidth: 150 }}
          >
            <option value="all">All Entities</option>
            <option value="Project">Project</option>
            <option value="Task">Task</option>
            <option value="RCA">RCA</option>
            <option value="User">User</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)"
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
            <FiClock size={28} style={{ marginBottom: 8, display: "block", marginLeft: "auto", marginRight: "auto" }} />
            No audit log entries found matching criteria.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Timestamp</th>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>User</th>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Action</th>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Entity</th>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Project</th>
                <th style={{ padding: "14px 20px", fontWeight: 700, color: "var(--color-text-muted)" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "var(--color-surface-hover)"} onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                  <td style={{ padding: "14px 20px", color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                    {formatDate(log.createdAt)}
                  </td>
                  <td style={{ padding: "14px 20px", fontWeight: 600 }}>
                    {log.user ? log.user.name : "System"}
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      background: "var(--color-surface-hover)",
                      padding: "3px 6px",
                      borderRadius: 4,
                      border: "1px solid var(--color-border)",
                      color: "var(--color-accent)"
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <span className="member-role-badge" style={{ fontSize: 11 }}>
                      {log.entity}
                    </span>
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--color-text-secondary)" }}>
                    {log.project ? log.project.name : "N/A"}
                  </td>
                  <td style={{ padding: "14px 20px", color: "var(--color-text-secondary)" }}>
                    {renderDetails(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
