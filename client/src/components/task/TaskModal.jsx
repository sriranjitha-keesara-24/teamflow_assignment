import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { taskService } from "../../services/taskService";
import { getProjectById } from "../../services/projectService";
import { FiX, FiExternalLink, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import SubtaskList from "./SubtaskList";
import CommentSection from "./CommentSection";
import api from "../../services/api";

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
  const [recurrence, setRecurrence] = useState("None");
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [timeLogs, setTimeLogs] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualDescription, setManualDescription] = useState("");

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

        // Fetch task templates
        const templatesRes = await api.get(`/projects/${projectId}/templates`);
        setTemplates(templatesRes.data?.data || templatesRes.data || []);

        if (isEdit) {
          setTitle(task.title || "");
          setDescription(task.description || "");
          setPriority(task.priority || "Medium");
          setStatus(task.status || "Todo");
          setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
          setTagsInput(task.tags?.join(", ") || "");
          setSelectedAssignees(task.assignees?.map((a) => a._id || a) || []);
          setTaskSubtasks(task.subtasks || []);
          setRecurrence(task.recurrence || "None");
          setTimeLogs(task.timeLogs || []);
          setActiveTimer(task.activeTimer || null);

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

  useEffect(() => {
    let interval = null;
    if (activeTimer && activeTimer.startTime) {
      const start = new Date(activeTimer.startTime);
      interval = setInterval(() => {
        const diffMs = new Date() - start;
        setTimerSeconds(Math.floor(diffMs / 1000));
      }, 1000);
    } else {
      setTimerSeconds(0);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  const formatStopwatch = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleStartTimer = async () => {
    try {
      const res = await api.post(`/projects/${projectId}/tasks/${task._id}/timer/start`);
      const data = res.data?.activeTimer || res.activeTimer || res;
      setActiveTimer(data);
      toast.success("Timer started");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to start timer");
    }
  };

  const handleStopTimer = async () => {
    const desc = window.prompt("Enter brief description of work completed (optional):");
    try {
      const res = await api.post(`/projects/${projectId}/tasks/${task._id}/timer/stop`, { description: desc || "" });
      const logs = res.data?.timeLogs || res.timeLogs;
      setTimeLogs(logs || []);
      setActiveTimer(null);
      toast.success("Timer stopped & logged successfully");
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to stop timer");
    }
  };

  const handleLogManualTime = async (e) => {
    e.preventDefault();
    if (!manualMinutes || isNaN(manualMinutes) || parseFloat(manualMinutes) <= 0) {
      toast.error("Please enter a valid duration in minutes");
      return;
    }
    try {
      const res = await api.post(`/projects/${projectId}/tasks/${task._id}/time-log`, {
        duration: parseFloat(manualMinutes),
        description: manualDescription
      });
      const logs = res.data?.timeLogs || res.timeLogs;
      setTimeLogs(logs || []);
      setManualMinutes("");
      setManualDescription("");
      toast.success("Logged manual time successfully");
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to log manual time");
    }
  };

  const handleSaveAsTemplate = async () => {
    const templateName = window.prompt("Enter a name for the task template:");
    if (!templateName || !templateName.trim()) return;

    try {
      const subtasks = taskSubtasks.map((s) => ({ title: s.title }));
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const templatePayload = {
        name: templateName.trim(),
        title,
        description,
        priority,
        tags,
        subtasks,
      };

      const res = await api.post(`/projects/${projectId}/templates`, templatePayload);
      const newTemplate = res.data?.data || res.data;
      setTemplates((prev) => [newTemplate, ...prev]);
      toast.success("Task template saved successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save template");
    }
  };

  const handleApplyTemplate = (templateId) => {
    setSelectedTemplateId(templateId);
    if (!templateId) return;

    const template = templates.find((t) => t._id === templateId);
    if (template) {
      setTitle(template.title || "");
      setDescription(template.description || "");
      setPriority(template.priority || "Medium");
      setTagsInput(template.tags?.join(", ") || "");
      setTaskSubtasks(template.subtasks || []);
      toast.success(`Applied template "${template.name}"`);
    }
  };

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
      recurrence,
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

              {templates.length > 0 && (
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label>Prefill from Task Template</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => handleApplyTemplate(e.target.value)}
                    style={{ width: "100%", background: "var(--color-primary-dim)", borderColor: "var(--color-primary)" }}
                  >
                    <option value="">-- Select a template --</option>
                    {templates.map((temp) => (
                      <option key={temp._id} value={temp._id}>{temp.name}</option>
                    ))}
                  </select>
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

              <div className="task-form-row">
                <div className="form-group">
                  <label>Recurrence</label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value)}
                    style={{ width: "100%" }}
                  >
                    <option value="None">None</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group" style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ width: "100%", height: 38 }}
                    onClick={handleSaveAsTemplate}
                    disabled={!title.trim()}
                  >
                    Save as Template
                  </button>
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

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: 13, color: "var(--color-text-secondary)", marginBottom: 6, display: "block" }}>Recurrence</label>
              <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)} style={{ width: "100%" }}>
                <option value="None">None</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
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
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
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

            {/* Time Tracking Widget */}
            <div style={{ paddingTop: 16, borderTop: "1px solid var(--color-border)", display: "flex", flexDirection: "column", gap: 10 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-secondary)" }}>
                Time Tracking
              </label>
              
              {/* Timer Controls */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-surface-hover)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                {activeTimer ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Timer Running</span>
                    <strong style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "var(--color-danger)" }}>
                      {formatStopwatch(timerSeconds)}
                    </strong>
                  </div>
                ) : (
                  <span style={{ fontSize: 12.5, color: "var(--color-text-secondary)" }}>No active timer</span>
                )}
                
                {activeTimer ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-danger"
                    onClick={handleStopTimer}
                  >
                    Stop & Log
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={handleStartTimer}
                  >
                    Start Timer
                  </button>
                )}
              </div>

              {/* Manual Time Logging Form */}
              <form onSubmit={handleLogManualTime} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="number"
                  placeholder="Mins"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  style={{ width: 64, height: 32, padding: "0 6px", fontSize: 11 }}
                />
                <input
                  type="text"
                  placeholder="Work description..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  style={{ flex: 1, height: 32, padding: "0 6px", fontSize: 11 }}
                />
                <button type="submit" className="btn btn-xs btn-secondary" style={{ height: 32 }}>
                  Log
                </button>
              </form>

              {/* Log History */}
              {timeLogs.length > 0 && (
                <div>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--color-text-muted)", display: "block", marginBottom: 6 }}>
                    Logged History ({parseFloat((timeLogs.reduce((sum, entry) => sum + (entry.duration || 0), 0) / 60).toFixed(1))} hrs total)
                  </span>
                  <div style={{ maxHeight: 110, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                    {timeLogs.map((log, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, background: "var(--color-surface-hover)", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 4 }}>
                          <strong>{log.duration}m</strong>: {log.description}
                        </span>
                        <span style={{ color: "var(--color-text-muted)", flexShrink: 0 }}>
                          {log.user?.name || "Member"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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