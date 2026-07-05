import { useState, useEffect } from "react";
import { FiSearch, FiCalendar, FiArrowUp, FiArrowDown, FiCheckSquare } from "react-icons/fi";
import { getInitials, formatDate, priorityBadgeClass } from "../../utils/formatters";
import DependencyBadge from "./DependencyBadge";

export default function ListView({ projectId, tasks, onTaskClick, projectMembers }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [assigneeFilter, setAssigneeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("dueDate");
  const [sortOrder, setSortOrder] = useState("asc");

  // Filtering
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "All" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || t.priority === priorityFilter;

    const matchesAssignee =
      assigneeFilter === "All" ||
      t.assignees?.some((a) => (a._id || a) === assigneeFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  // Sorting
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "title") {
      comparison = (a.title || "").localeCompare(b.title || "");
    } else if (sortBy === "status") {
      comparison = (a.status || "").localeCompare(b.status || "");
    } else if (sortBy === "priority") {
      const priorityWeights = { Low: 1, Medium: 2, High: 3, Critical: 4 };
      comparison = (priorityWeights[a.priority] || 0) - (priorityWeights[b.priority] || 0);
    } else if (sortBy === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      comparison = new Date(a.dueDate) - new Date(b.dueDate);
    }

    return sortOrder === "asc" ? comparison : -comparison;
  });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const isOverdue = (dateStr, status) => {
    if (!dateStr || status === "Completed") return false;
    return new Date(dateStr) < new Date();
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? <FiArrowUp style={{ marginLeft: 4 }} /> : <FiArrowDown style={{ marginLeft: 4 }} />;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Filters Toolbar */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        {/* Search */}
        <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
          <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", paddingLeft: 34, paddingRight: 12, fontSize: 13, height: 38 }}
          />
        </div>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ fontSize: 13, height: 38 }}
        >
          <option value="All">All Statuses</option>
          <option value="Todo">Todo</option>
          <option value="In Progress">In Progress</option>
          <option value="Review">Review</option>
          <option value="Completed">Completed</option>
        </select>

        {/* Priority */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ fontSize: 13, height: 38 }}
        >
          <option value="All">All Priorities</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Critical">Critical</option>
        </select>

        {/* Assignee */}
        <select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={{ fontSize: 13, height: 38, maxWidth: 200 }}
        >
          <option value="All">All Assignees</option>
          {projectMembers.map((m) => {
            if (!m.user) return null;
            return (
              <option key={m.user._id} value={m.user._id}>
                {m.user.name}
              </option>
            );
          })}
        </select>
      </div>

      {/* Task Table */}
      <div style={{ overflowX: "auto", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 13.5, textAlign: "left" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)" }}>
              <th onClick={() => handleSort("title")} style={{ padding: "12px 16px", cursor: "pointer", userSelect: "none" }}>
                Task Title {getSortIcon("title")}
              </th>
              <th onClick={() => handleSort("status")} style={{ padding: "12px 16px", cursor: "pointer", userSelect: "none", width: 120 }}>
                Status {getSortIcon("status")}
              </th>
              <th onClick={() => handleSort("priority")} style={{ padding: "12px 16px", cursor: "pointer", userSelect: "none", width: 120 }}>
                Priority {getSortIcon("priority")}
              </th>
              <th style={{ padding: "12px 16px", width: 120 }}>Checklist</th>
              <th onClick={() => handleSort("dueDate")} style={{ padding: "12px 16px", cursor: "pointer", userSelect: "none", width: 140 }}>
                Due Date {getSortIcon("dueDate")}
              </th>
              <th style={{ padding: "12px 16px", width: 120 }}>Assignees</th>
            </tr>
          </thead>
          <tbody>
            {sortedTasks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "40px 16px", textAlign: "center", color: "var(--color-text-muted)" }}>
                  <FiCheckSquare size={32} style={{ marginBottom: 8, display: "block", marginLeft: "auto", marginRight: "auto" }} />
                  No tasks found matching criteria.
                </td>
              </tr>
            ) : (
              sortedTasks.map((t) => {
                const totalSub = t.subtasks?.length || 0;
                const doneSub = t.subtasks?.filter((s) => s.completed).length || 0;

                return (
                  <tr
                    key={t._id}
                    onClick={() => onTaskClick(t)}
                    className="table-row-hover"
                    style={{ borderBottom: "1px solid var(--color-border)", cursor: "pointer", transition: "background 0.2s" }}
                  >
                    <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span>{t.title}</span>
                        {t.isBlocked && (
                          <div style={{ display: "inline-block", marginTop: 2 }}>
                            <DependencyBadge blockedBy={t.blockedBy} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className="badge badge-completed" style={{ background: "var(--color-primary-dim)", color: "var(--color-primary-hover)" }}>
                        {t.status}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span className={`badge ${priorityBadgeClass(t.priority)}`}>{t.priority}</span>
                    </td>
                    <td style={{ padding: "14px 16px", color: "var(--color-text-secondary)" }}>
                      {totalSub > 0 ? `${doneSub}/${totalSub}` : "-"}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      {t.dueDate ? (
                        <span
                          style={{
                            color: isOverdue(t.dueDate, t.status) ? "var(--color-danger)" : "inherit",
                            fontWeight: isOverdue(t.dueDate, t.status) ? "bold" : "normal",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <FiCalendar size={13} />
                          {formatDate(t.dueDate)}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {t.assignees?.map((a) => (
                          <div
                            key={a._id || a}
                            className="avatar avatar-sm"
                            title={a.name || "User"}
                            style={{ width: 24, height: 24, fontSize: 9 }}
                          >
                            {getInitials(a.name || "U")}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
