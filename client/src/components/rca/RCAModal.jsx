import { useEffect, useState } from "react";
import { rcaService } from "../../services/rcaService";
import { taskService } from "../../services/taskService";
import { FiX } from "react-icons/fi";
import toast from "react-hot-toast";

export default function RCAModal({ rca, projectId, onClose, onSaved }) {
  const isEdit = !!rca;

  const [title, setTitle] = useState("");
  const [incidentDescription, setIncidentDescription] = useState("");
  const [impact, setImpact] = useState("");
  const [rootCause, setRootCause] = useState("");
  const [resolutionSteps, setResolutionSteps] = useState("");
  const [taskId, setTaskId] = useState("");
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRcaFormData = async () => {
      try {
        const tasksRes = await taskService.list(projectId);
        setTasks(tasksRes.tasks || tasksRes.data || tasksRes || []);

        if (isEdit) {
          setTitle(rca.title || "");
          setIncidentDescription(rca.incidentDescription || "");
          setImpact(rca.impact || "");
          setRootCause(rca.rootCause || "");
          setResolutionSteps(rca.resolutionSteps || "");
          setTaskId(rca.task?._id || rca.task || "");
        }
      } catch (err) {
        console.error("Could not load RCA form helpers", err);
      }
    };

    loadRcaFormData();
  }, [projectId, rca, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !incidentDescription.trim()) return;

    setLoading(true);
    setError("");

    const payload = {
      title,
      incidentDescription,
      impact,
      rootCause,
      resolutionSteps,
      task: taskId || null,
    };

    try {
      if (isEdit) {
        await rcaService.update(rca._id, payload);
        toast.success("RCA updated");
      } else {
        await rcaService.create(projectId, payload);
        toast.success("RCA created");
      }
      onSaved();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Operation failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit RCA Report" : "Create RCA Report"}</h2>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rca-form">
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div className="card" style={{ background: "var(--color-danger-dim)", borderColor: "var(--color-danger)", color: "var(--color-danger)", padding: "10px 14px", fontSize: 13 }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>RCA Title</label>
              <input
                type="text"
                placeholder="RCA title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Associated Task (Optional)</label>
              <select value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                <option value="">-- Select Associated Task --</option>
                {tasks.map((t) => (
                  <option key={t._id} value={t._id}>{t.title} ({t.status})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Incident Description</label>
              <textarea
                placeholder="Describe what occurred, dates, and severity..."
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="form-group">
              <label>Impact Details</label>
              <textarea
                placeholder="System downtime, user impact, security concerns..."
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>Root Cause</label>
              <textarea
                placeholder="Why did this occur? (e.g. code bug, system load, missing indexes)..."
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Resolution Steps</label>
              <textarea
                placeholder="What steps were taken to resolve this, and what is the fix plan..."
                value={resolutionSteps}
                onChange={(e) => setResolutionSteps(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Save RCA" : "Create RCA"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
