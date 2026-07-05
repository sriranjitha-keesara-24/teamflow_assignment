import { useState, useEffect } from "react";
import KanbanBoard from "./KanbanBoard";
import ListView from "./ListView";
import CalendarView from "./CalendarView";
import DependencyGraph from "./DependencyGraph";
import TaskModal from "./TaskModal";
import { taskService } from "../../services/taskService";
import { FiGrid, FiList, FiCalendar, FiGitPullRequest, FiPlus } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ProjectTasks({ projectId, projectMembers = [] }) {
  const [view, setView] = useState("Board"); // Board, List, Calendar, Dependencies
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal controls
  const [activeTask, setActiveTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.list(projectId);
      setTasks(data.tasks || data.data || data || []);
    } catch (err) {
      toast.error("Could not fetch project tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleTaskClick = (task) => {
    setActiveTask(task);
  };

  const handleAddTaskClick = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setActiveTask(null);
    setShowCreateModal(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tab select bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          borderBottom: "1px solid var(--color-border)",
          paddingBottom: 12,
        }}
      >
        <div style={{ display: "flex", gap: 6, background: "var(--color-surface-hover)", padding: 4, borderRadius: "var(--radius-md)" }}>
          <button
            className={`btn btn-xs ${view === "Board" ? "btn-primary" : "btn-secondary"}`}
            style={{ display: "flex", alignItems: "center", gap: 6, border: "none" }}
            onClick={() => setView("Board")}
          >
            <FiGrid size={13} /> Board
          </button>
          <button
            className={`btn btn-xs ${view === "List" ? "btn-primary" : "btn-secondary"}`}
            style={{ display: "flex", alignItems: "center", gap: 6, border: "none" }}
            onClick={() => setView("List")}
          >
            <FiList size={13} /> List View
          </button>
          <button
            className={`btn btn-xs ${view === "Calendar" ? "btn-primary" : "btn-secondary"}`}
            style={{ display: "flex", alignItems: "center", gap: 6, border: "none" }}
            onClick={() => setView("Calendar")}
          >
            <FiCalendar size={13} /> Calendar
          </button>
          <button
            className={`btn btn-xs ${view === "Dependencies" ? "btn-primary" : "btn-secondary"}`}
            style={{ display: "flex", alignItems: "center", gap: 6, border: "none" }}
            onClick={() => setView("Dependencies")}
          >
            <FiGitPullRequest size={13} /> Dependencies
          </button>
        </div>

        {view !== "Board" && (
          <button
            className="btn btn-sm btn-primary"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
            onClick={handleAddTaskClick}
          >
            <FiPlus /> Add Task
          </button>
        )}
      </div>

      {/* Render selected view */}
      <div style={{ minHeight: 350 }}>
        {view === "Board" && (
          <KanbanBoard
            projectId={projectId}
            tasks={tasks}
            loading={loading}
            loadTasks={loadTasks}
            onTaskClick={handleTaskClick}
            onAddTaskClick={handleAddTaskClick}
          />
        )}

        {view === "List" && (
          <ListView
            projectId={projectId}
            tasks={tasks}
            projectMembers={projectMembers}
            onTaskClick={handleTaskClick}
          />
        )}

        {view === "Calendar" && (
          <CalendarView
            tasks={tasks}
            onTaskClick={handleTaskClick}
          />
        )}

        {view === "Dependencies" && (
          <DependencyGraph
            projectId={projectId}
            tasks={tasks}
            onUpdated={loadTasks}
          />
        )}
      </div>

      {/* Task Creation Modal */}
      {showCreateModal && (
        <TaskModal
          projectId={projectId}
          onClose={handleCloseModal}
          onUpdated={loadTasks}
        />
      )}

      {/* Task Detail/Edit Modal */}
      {activeTask && (
        <TaskModal
          task={activeTask}
          projectId={projectId}
          onClose={handleCloseModal}
          onUpdated={loadTasks}
        />
      )}
    </div>
  );
}
