import { useState, useEffect } from "react";
import { FiPlus, FiFolder } from "react-icons/fi";
import toast from "react-hot-toast";
import { getProjects } from "../services/projectService";
import ProjectCard from "../components/projects/ProjectCard";
import ProjectModal from "../components/projects/ProjectModal";
import "../styles/Projects.css";

const STATUS_FILTERS = ["All", "Active", "On Hold", "Completed", "Archived"];

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeFilter === "Archived") {
        params.status = "Archived";
        params.includeArchived = "true";
      } else if (activeFilter !== "All") {
        params.status = activeFilter;
      }
      const data = await getProjects(params);
      setProjects(data.data || []);
    } catch (err) {
      toast.error("Could not load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  const handleCreated = (project) => {
    setShowModal(false);
    setProjects((prev) => [project, ...prev]);
  };

  return (
    <div className="container" style={{ paddingBottom: 60, animation: "fadeIn 0.35s ease" }}>
      <div className="page-header">
        <div>
          <h1>Projects</h1>
          <p className="page-subtitle">Manage and switch between your team workspaces</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ display: "flex", alignItems: "center", gap: 6 }}
        >
          <FiPlus size={16} /> New project
        </button>
      </div>

      <div className="filter-bar">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            className={`filter-chip ${activeFilter === filter ? "active" : ""}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FiFolder size={36} style={{ marginBottom: 12, color: "var(--color-text-muted)" }} />
          <h3>No projects yet</h3>
          <p>Create your first project to start organizing tasks and your team.</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}

      {showModal && (
        <ProjectModal onClose={() => setShowModal(false)} onSaved={handleCreated} />
      )}
    </div>
  );
};

export default Projects;