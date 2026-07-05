import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { taskService } from "../services/taskService";
import { formatDate } from "../utils/formatters";
import { FiCheckSquare, FiFilter, FiCalendar, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import "../styles/tasks.css";

const STATUS_FILTERS = ["All", "Todo", "In Progress", "Review", "Completed"];
const PRIORITY_FILTERS = ["All", "Low", "Medium", "High", "Critical"];

const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("dueDate");

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== "All") params.status = statusFilter;
      if (priorityFilter !== "All") params.priority = priorityFilter;
      params.sort = sortBy;

      const res = await taskService.getMyTasks(params);
      setTasks(res.data || []);
    } catch (err) {
      toast.error("Could not fetch your tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, sortBy]);

  const isOverdue = (dueDateStr) => {
    if (!dueDateStr) return false;
    return new Date(dueDateStr) < new Date();
  };

  return (
    <div className="container" style={{ paddingBottom: 60, animation: "fadeIn 0.35s ease" }}>
      <div className="page-header">
        <div>
          <h1>My Tasks</h1>
          <p className="page-subtitle">Track and update tasks assigned to you across all projects</p>
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ padding: "6px 12px", fontSize: 13 }}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ padding: "6px 12px", fontSize: 13 }}
            >
              {PRIORITY_FILTERS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort option */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: "6px 12px", fontSize: 13 }}
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="newest">Created Date</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <FiCheckSquare size={36} style={{ marginBottom: 12, color: "var(--color-text-muted)" }} />
          <h3>No tasks assigned</h3>
          <p>You have no pending tasks matching the selected filters.</p>
        </div>
      ) : (
        <div className="my-tasks-list">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="my-task-row"
              onClick={() => navigate(`/tasks/${task._id}`)}
            >
              <div className={`my-task-priority-dot ${task.priority}`} title={`Priority: ${task.priority}`} />
              <div className="my-task-info">
                <div className="my-task-title">{task.title}</div>
                <div className="my-task-project">Project: {task.project?.name || "Deleted Project"}</div>
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="badge badge-completed" style={{ background: "var(--color-primary-dim)", color: "var(--color-primary-hover)" }}>
                  {task.status}
                </span>

                {task.dueDate && (
                  <div className={`my-task-due ${isOverdue(task.dueDate) && task.status !== "Completed" ? "overdue" : ""}`}>
                    <FiCalendar size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />
                    {formatDate(task.dueDate)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;
