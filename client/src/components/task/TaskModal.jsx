import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { taskService } from "../../services/taskService";
import { getProjectById } from "../../services/projectService";
import { FiX, FiExternalLink, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import SubtaskList from "./SubtaskList";
import CommentSection from "./CommentSection";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const STATUSES = ["Todo", "In Progress", "Review", "Completed"];

export default function TaskModal({ task, projectId, onClose, onUpdated }) {
  const isEdit = !!task;

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [status, setStatus] = useState("Todo");
  const [dueDate, setDueDate] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState([]);
  const [taskSubtasks, setTaskSubtasks] = useState([]);

  // Project members & other tasks (for dependencies)
  const [members, setMembers] = useState([]);
  const [otherTasks, setOtherTasks] = useState([]);
  const [dependencyGraph, setDependencyGraph] = useState(null);
  const [selectedPredecessor, setSelectedPredecessor] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadModalData = async () => {
      try {
        const projectRes = await getProjectById(projectId);
        const projectData = projectRes.data || projectRes.project;
        let allMembers = [];
        if (projectData) {
          if (projectData.owner) {
            allMembers.push({
              user: projectData.owner,
              role: "Owner",
              _id: projectData.owner._id,
            });
          }
          if (projectData.members) {
            const extraMembers = projectData.members.filter(
              (m) => m.user && m.user._id !== projectData.owner?._id
            );
            allMembers = [...allMembers, ...extraMembers];
          }
        }
        setMembers(allMembers);

        const tasksRes = await taskService.list(projectId);
        const allTasks = tasksRes.tasks || tasksRes.data || tasksRes || [];
        setOtherTasks(allTasks.filter((t) => !isEdit || t._id !== task._id));

        if (isEdit) {
          setTitle(task.title || "");
          setDescription(task.description || "");
          setPriority(task.priority || "Medium");
          setStatus(task.status || "Todo");
          setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
          setTagsInput(task.tags?.join(", ") || "");
          setSelectedAssignees(task.assignees?.map((a) => a._id || a) || []);
          setTaskSubtasks(task.subtasks || []);

          // Load dependencies graph
          const graph = await taskService.getDependencyGraph(projectId);
          setDependencyGraph(graph.data || graph);
        }
      } catch (err) {
        console.error("Could not load form helper data", err);
      }
    };

    loadModalData();
  }, [projectId, task, isEdit]);

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError("");

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title,
      description,
      priority,
      status,
      dueDate: dueDate || null,
      tags,
      assignees: selectedAssignees,
    };

    try {
      if (isEdit) {
        await taskService.update(projectId, task._id, payload);
        toast.success("Task updated");
      } else {
        await taskService.create(projectId, payload);
        toast.success("Task created");
      }
      onUpdated();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task? This cannot be undone.")) return;
    setLoading(true);
    try {
      await taskService.remove(projectId, task._id);
      toast.success("Task deleted");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete task");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedPredecessor) return;
    try {
      await taskService.addDependency(projectId, selectedPredecessor, task._id);
      toast.success("Dependency added");
      setSelectedPredecessor("");
      // Refresh dependency graph
      const graph = await taskService.getDependencyGraph(projectId);
      setDependencyGraph(graph.data || graph);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add dependency");
    }
  };

  const handleRemoveDependency = async (relationId) => {
    try {
      await taskService.removeDependency(projectId, relationId);
      toast.success("Dependency removed");
      // Refresh dependency graph
      const graph = await taskService.getDependencyGraph(projectId);
      setDependencyGraph(graph.data || graph);
    } catch (err) {
      toast.error("Failed to remove dependency");
    }
  };

  const handleAssigneeChange = (userId) => {
    setSelectedAssignees((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSubtasksUpdate = (updatedTask) => {
    setTaskSubtasks(updatedTask.subtasks || []);
    onUpdated();
  };

  // Get active dependencies for this task
  const currentDependencies = dependencyGraph?.relations?.filter(
    (r) => r.successor?._id === task?._id || r.successor === task?._id
  ) || [];

  if (!isEdit) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ maxWidth: 580, width: "100%" }}>
          <div className="modal-header">
            <h2>Create Task</h2>
            <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
              <FiX size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body task-form">
              {error && (
                <div className="card" style={{ background: "var(--color-danger-dim)", borderColor: "var(--color-danger)", color: "var(--color-danger)", padding: "10px 14px", fontSize: 13 }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label>Task Title</label>
                <input
                  type="text"
                  placeholder="Name your task..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Detail what needs to be done..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="task-form-row">
                <div className="form-group">
                  <label>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="task-form-row">
                <div className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="marketing, ui, bug"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Assignees selection list */}
              <div className="form-group">
                <label>Assignees</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", padding: 12, borderRadius: "var(--radius-md)" }}>
                  {members.length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No project members to assign.</span>
                  ) : (
                    members.map((m) => {
                      if (!m.user) return null;
                      return (
                        <label key={m.user._id} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", background: "var(--color-surface)", border: "1px solid var(--color-border)", padding: "4px 10px", borderRadius: "var(--radius-sm)" }}>
                          <input
                            type="checkbox"
                            checked={selectedAssignees.includes(m.user._id)}
                            onChange={() => handleAssigneeChange(m.user._id)}
                          />
                          {m.user.name}
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
                {loading ? "Creating..." : "Create task"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Edit Task Jira-style Split Pane Modal Layout
  return (
    <div className="modal-overlay">
      <div className="modal-content jira-task-modal" style={{ maxWidth: 1000, width: "95vw", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-header">
          <h2>Edit Task</h2>
          <div style={{ display: "flex", gap: 10 }}>
            <Link to={`/tasks/${task._id}`} className="btn btn-xs btn-secondary" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <FiExternalLink /> View Details Page
            </Link>
            <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
              <FiX size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body split-layout" style={{ display: "flex", gap: 24, overflowY: "auto", flex: 1, padding: 20 }}>
          {/* Left Pane: Details, Checklist, Comments */}
          <div className="pane-left" style={{ flex: 1.6, display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
            {error && (
              <div className="card" style={{ background: "var(--color-danger-dim)", borderColor: "var(--color-danger)", color: "var(--color-danger)", padding: "10px 14px", fontSize: 13 }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Task Title</label>
              <input
                type="text"
                placeholder="Name your task..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ fontSize: 16, fontWeight: 700 }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Description</label>
              <textarea
                placeholder="Detail what needs to be done..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            {/* Checklist/Subtasks */}
            <SubtaskList
              projectId={projectId}
              taskId={task._id}
              subtasks={taskSubtasks}
              onUpdate={handleSubtasksUpdate}
            />

            {/* Comments/Discussion */}
            <CommentSection taskId={task._id} />
          </div>

          {/* Right Pane: Status & Settings */}
          <div className="pane-right" style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16, borderLeft: "1px solid var(--color-border)", paddingLeft: 24 }}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "100%" }}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Priority</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ width: "100%" }}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Tags (comma separated)</label>
              <input
                type="text"
                placeholder="marketing, ui, bug"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>

            {/* Assignees selection list */}
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Assignees</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 150, overflowY: "auto", background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", padding: 10, borderRadius: "var(--radius-md)" }}>
                {members.length === 0 ? (
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No project members to assign.</span>
                ) : (
                  members.map((m) => {
                    if (!m.user) return null;
                    return (
                      <label key={m.user._id} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer", padding: "2px 4px" }}>
                        <input
                          type="checkbox"
                          checked={selectedAssignees.includes(m.user._id)}
                          onChange={() => handleAssigneeChange(m.user._id)}
                        />
                        {m.user.name}
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Task Dependencies Section */}
            <div style={{ paddingTop: 12, borderTop: "1px solid var(--color-border)" }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>
                Task Dependencies
              </label>

              {/* List current dependencies */}
              {currentDependencies.length > 0 && (
                <ul style={{ listStyle: "none", marginBottom: 10, display: "flex", flexDirection: "column", gap: 4, padding: 0 }}>
                  {currentDependencies.map((rel) => (
                    <li key={rel._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-surface-hover)", padding: "4px 8px", borderRadius: "var(--radius-sm)", fontSize: 12 }}>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Depends on: <strong>{rel.predecessor?.title}</strong>
                      </span>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ color: "var(--color-danger)", padding: 2, display: "inline-flex" }}
                        onClick={() => handleRemoveDependency(rel._id)}
                      >
                        <FiX size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {/* Add new dependency */}
              <div style={{ display: "flex", gap: 6 }}>
                <select
                  value={selectedPredecessor}
                  onChange={(e) => setSelectedPredecessor(e.target.value)}
                  style={{ flex: 1, padding: "4px 6px", fontSize: 12 }}
                >
                  <option value="">-- Select Predecessor --</option>
                  {otherTasks.map((t) => (
                    <option key={t._id} value={t._id}>{t.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={handleAddDependency}
                  disabled={!selectedPredecessor}
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--color-border)", padding: 14 }}>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={loading}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <FiTrash2 /> Delete Task
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}