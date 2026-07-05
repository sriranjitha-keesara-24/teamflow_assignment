import { useState, useEffect } from "react";
import { taskService } from "../../services/taskService";
import { FiLink, FiPlus, FiTrash2, FiAlertTriangle, FiLayers } from "react-icons/fi";
import toast from "react-hot-toast";

export default function DependencyGraph({ projectId, tasks, onUpdated }) {
  const [relations, setRelations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form selections
  const [predecessorId, setPredecessorId] = useState("");
  const [successorId, setSuccessorId] = useState("");

  const loadGraph = async () => {
    try {
      setLoading(true);
      const res = await taskService.getDependencyGraph(projectId);
      setRelations(res.data || res || []);
    } catch (err) {
      toast.error("Failed to load dependency relations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!predecessorId || !successorId) {
      toast.error("Please select both predecessor and successor tasks");
      return;
    }
    if (predecessorId === successorId) {
      toast.error("A task cannot depend on itself");
      return;
    }

    try {
      await taskService.addDependency(projectId, predecessorId, successorId);
      toast.success("Dependency created successfully");
      setPredecessorId("");
      setSuccessorId("");
      loadGraph();
      if (onUpdated) onUpdated();
    } catch (err) {
      const msg = err.response?.data?.message || "Circular or duplicate dependency detected";
      toast.error(msg);
    }
  };

  const handleDelete = async (relationId) => {
    if (!window.confirm("Delete this dependency relation?")) return;
    try {
      await taskService.removeDependency(projectId, relationId);
      toast.success("Dependency deleted");
      loadGraph();
      if (onUpdated) onUpdated();
    } catch (err) {
      toast.error("Could not delete dependency");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
        <div className="spinner" />
      </div>
    );
  }

  // Generate dependency chains (group by predecessor to show tree structure)
  const renderDependencyChains = () => {
    if (relations.length === 0) {
      return (
        <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--color-text-muted)", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}>
          <FiLink size={28} style={{ marginBottom: 8, display: "block", marginLeft: "auto", marginRight: "auto" }} />
          No dependencies mapped for this project yet.
        </div>
      );
    }

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {relations.map((rel) => (
          <div
            key={rel._id}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: "12px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13.5 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600 }}>PREDECESSOR</span>
                <span style={{ fontWeight: 600, color: rel.predecessor?.status === "Completed" ? "var(--color-success)" : "inherit" }}>
                  {rel.predecessor?.title || "Deleted Task"}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Status: {rel.predecessor?.status}</span>
              </div>

              <div style={{ color: "var(--color-primary)", fontWeight: "bold", padding: "0 10px" }}>➡ blocks ➡</div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600 }}>SUCCESSOR</span>
                <span style={{ fontWeight: 600, color: rel.predecessor?.status !== "Completed" ? "var(--color-danger)" : "inherit" }}>
                  {rel.successor?.title || "Deleted Task"}
                </span>
                <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>Status: {rel.successor?.status}</span>
              </div>
            </div>

            <button
              onClick={() => handleDelete(rel._id)}
              style={{ color: "var(--color-danger)", padding: 6, display: "inline-flex" }}
              title="Delete Relation"
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
      {/* Dependency Relations List */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <FiLayers /> Dependency Mapping Chains
        </h3>
        {renderDependencyChains()}
      </div>

      {/* Add Dependency Pane */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 18, height: "fit-content" }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <FiLink /> Link Tasks
        </h3>

        <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>Predecessor (Blocked task depends on)</label>
            <select
              value={predecessorId}
              onChange={(e) => setPredecessorId(e.target.value)}
              style={{ fontSize: 13, width: "100%" }}
            >
              <option value="">-- Select Predecessor --</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-secondary)" }}>Successor (Task to block)</label>
            <select
              value={successorId}
              onChange={(e) => setSuccessorId(e.target.value)}
              style={{ fontSize: 13, width: "100%" }}
            >
              <option value="">-- Select Successor --</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.status})
                </option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-sm btn-primary" style={{ width: "100%", marginTop: 4 }}>
            <FiPlus style={{ marginRight: 6 }} /> Link Dependency
          </button>
        </form>

        <div style={{ display: "flex", gap: 8, background: "var(--color-primary-dim)", padding: 12, borderRadius: "var(--radius-md)", marginTop: 16, fontSize: 12, color: "var(--color-text-secondary)" }}>
          <FiAlertTriangle size={24} style={{ color: "var(--color-warning)", flexShrink: 0 }} />
          <span>
            <strong>Jira Business Rule:</strong> Successor status cannot advance past <em>Todo</em> if predecessor task status is not <em>Completed</em>.
          </span>
        </div>
      </div>
    </div>
  );
}
