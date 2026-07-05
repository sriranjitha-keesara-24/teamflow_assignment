import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { createProject, updateProject } from "../../services/projectService";
import { FiX } from "react-icons/fi";

const emptyForm = {
  name: "",
  description: "",
  status: "Active",
  visibility: "Private",
  priority: "Medium",
  deadline: "",
};

const normalizeVisibility = (visibility) => {
  if (!visibility) return "Private";
  const normalized = visibility.toString().trim().toLowerCase();
  if (normalized === "private") return "Private";
  if (normalized === "team") return "Public"; // matching database enum
  if (normalized === "public") return "Public";
  return "Private";
};

const ProjectModal = ({ project, onClose, onSaved }) => {
  const isEdit = Boolean(project);
  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name || "",
        description: project.description || "",
        status: project.status || "Active",
        visibility: normalizeVisibility(project.visibility),
        priority: project.priority || "Medium",
        deadline: project.deadline ? project.deadline.slice(0, 10) : "",
      });
    }
  }, [project]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setErrors({ name: "Project name is required" });
      return;
    }

    const payload = {
      ...formData,
      deadline: formData.deadline || null,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        const data = await updateProject(project._id, payload);
        toast.success("Project updated");
        onSaved(data.data || data.project || data);
      } else {
        const data = await createProject(payload);
        toast.success("Project created");
        onSaved(data.data || data.project || data);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Project" : "Create New Project"}</h2>
          <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {errors.name && (
              <div className="badge badge-priority-critical" style={{ padding: "8px 12px", borderRadius: "var(--radius-md)" }}>
                {errors.name}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Project Name</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Customer Portal Revamp"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                placeholder="What is this project about?"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" value={formData.status} onChange={handleChange}>
                  <option>Active</option>
                  <option>On Hold</option>
                  <option>Completed</option>
                  <option>Archived</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="priority">Priority</label>
                <select id="priority" name="priority" value={formData.priority} onChange={handleChange}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="visibility">Visibility</label>
                <select id="visibility" name="visibility" value={formData.visibility} onChange={handleChange}>
                  <option value="Private">Private (members only)</option>
                  <option value="Public">Public (visible to org)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="deadline">Deadline</label>
                <input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;