import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { taskService } from "../services/taskService";
import DependencyBadge from "../components/task/DependencyBadge";
import SubtaskList from "../components/task/SubtaskList";
import CommentSection from "../components/task/CommentSection";
import { formatDate, priorityBadgeClass } from "../utils/formatters";
import { FiArrowLeft, FiClock, FiTag, FiGitCommit, FiLayers } from "react-icons/fi";
import toast from "react-hot-toast";
import "../styles/tasks.css";

const STATUSES = ["Todo", "In Progress", "Review", "Completed"];

const TaskDetails = () => {
  const { id: taskId } = useParams();
  const navigate = useNavigate();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTask = async () => {
    try {
      // Since we don't have the real projectId on notification load, we can pass "any"
      const res = await taskService.get("any", taskId);
      setTask(res.task || res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load task details");
      toast.error("Could not load task details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTask();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const handleStatusChange = async (status) => {
    if (!task) return;
    try {
      setError("");
      const res = await taskService.updateStatus(task.project?._id || "any", task._id, status);
      setTask(res.task || res.data);
      toast.success(`Task status updated to ${status}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Could not update status";
      setError(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  if (error && !task) {
    return (
      <div className="container" style={{ paddingTop: 40 }}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm" style={{ marginBottom: 20 }}>
          <FiArrowLeft /> Go Back
        </button>
        <div className="card" style={{ border: "1px solid var(--color-danger)", padding: 24, textAlign: "center" }}>
          <h3 style={{ color: "var(--color-danger)", marginBottom: 8 }}>Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const projectId = task.project?._id || "any";

  return (
    <div className="container task-detail" style={{ paddingBottom: 60 }}>
      <button
        onClick={() => navigate(-1)}
        className="btn btn-ghost btn-sm"
        style={{ marginBottom: 20, display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <FiArrowLeft /> Back
      </button>

      {/* Task Header */}
      <div className="task-detail-header">
        <h1 className="task-detail-title">{task.title}</h1>
        <div className="task-detail-meta">
          <span className={`badge ${priorityBadgeClass(task.priority)}`}>
            {task.priority} Priority
          </span>
          <span className="badge badge-completed" style={{ background: "var(--color-primary-dim)", color: "var(--color-primary-hover)" }}>
            Project: {task.project?.name}
          </span>
        </div>
      </div>

      {/* Dependency Blocking Warning */}
      {task.isBlocked && (
        <div style={{ marginBottom: 16 }}>
          <DependencyBadge blockedBy={task.blockedBy} />
        </div>
      )}

      {error && (
        <div className="card" style={{ background: "var(--color-danger-dim)", borderColor: "var(--color-danger)", color: "var(--color-danger)", padding: "12px 16px", marginBottom: 16, fontSize: 13.5 }}>
          {error}
        </div>
      )}

      {/* Status Transition Control Area */}
      <div className="task-detail-section">
        <h3 className="task-detail-section-title">Status Action</h3>
        <div className="status-selector">
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`status-btn ${task.status === s ? "active" : ""}`}
              onClick={() => handleStatusChange(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Task Description */}
      <div className="task-detail-section">
        <h3 className="task-detail-section-title">Description</h3>
        <p className="task-detail-desc">
          {task.description || "No description provided for this task."}
        </p>
      </div>

      {/* Checklist (Subtasks) */}
      <SubtaskList
        projectId={projectId}
        taskId={task._id}
        subtasks={task.subtasks}
        onUpdate={(updatedTask) => setTask(updatedTask)}
      />

      {/* Comments / Discussion Thread */}
      <CommentSection taskId={task._id} />

      {/* Extra Metadata Panel (Assignees, Tags) */}
      <div className="task-detail-section">
        <h3 className="task-detail-section-title">Details</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Assignees */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", width: 90 }}>Assignees:</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {task.assignees?.length === 0 ? (
                <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontStyle: "italic" }}>Unassigned</span>
              ) : (
                task.assignees?.map((u) => (
                  <span key={u._id} className="badge badge-completed" style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)" }}>
                    {u.name}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Due date */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", width: 90 }}>Due Date:</span>
            <span style={{ fontSize: 13.5, display: "flex", alignItems: "center", gap: 6 }}>
              <FiClock size={14} style={{ color: "var(--color-text-muted)" }} />
              {formatDate(task.dueDate)}
            </span>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)", width: 90 }}>Tags:</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {task.tags?.length === 0 ? (
                <span style={{ fontSize: 13, color: "var(--color-text-muted)", fontStyle: "italic" }}>None</span>
              ) : (
                task.tags?.map((t) => (
                  <span key={t} className="badge" style={{ background: "var(--color-surface-hover)", fontSize: 11, border: "1px solid var(--color-border)" }}>
                    <FiTag size={10} style={{ marginRight: 4 }} />
                    {t}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;