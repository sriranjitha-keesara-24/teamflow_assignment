// import { useEffect, useState } from "react";
// import KanbanColumn from "./KanbanColumn";
// import { taskService } from "../../services/taskService";
// import { FiPlus } from "react-icons/fi";
// import TaskModal from "./TaskModal";
// import toast from "react-hot-toast";

// const STATUSES = ["Todo", "In Progress", "Review", "Completed"];

import { useEffect, useState } from "react";
import KanbanColumn from "./KanbanColumn";
import { taskService } from "../../services/taskService";
import { FiPlus } from "react-icons/fi";
import TaskModal from "./TaskModal";
import toast from "react-hot-toast";

const STATUSES = ["Todo", "In Progress", "Review", "Completed"];

export default function KanbanBoard({
  projectId,
  tasks: propTasks,
  loading: propLoading,
  loadTasks: propLoadTasks,
  onTaskClick,
  onAddTaskClick
}) {
  const [localTasks, setLocalTasks] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTask, setActiveTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const isShared = propTasks !== undefined;
  const tasks = isShared ? propTasks : localTasks;
  const loading = isShared ? propLoading : localLoading;

  const loadTasks = async () => {
    if (isShared) {
      if (propLoadTasks) await propLoadTasks();
      return;
    }
    try {
      const data = await taskService.list(projectId);
      setLocalTasks(data.tasks || data.data || data);
    } catch (err) {
      toast.error("Could not fetch project tasks");
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (!isShared) {
      loadTasks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isShared]);

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData("text/task-id", task._id);
  };

  const handleDrop = async (taskId, newStatus) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    const previousStatus = task.status;

    // Optimistic UI updates
    if (isShared) {
      // If shared, we notify parent or temporarily update locally if supported.
      // But we can update using local helper and let backend refresh
    }

    // Fallback/direct update
    const updateTasksState = (updater) => {
      if (isShared) {
        // We can just rely on the try-catch update and loadTasks
      } else {
        setLocalTasks(updater);
      }
    };

    updateTasksState((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: newStatus } : t)));
    setError("");

    try {
      const updated = await taskService.updateStatus(projectId, taskId, newStatus);
      toast.success(`Task moved to ${newStatus}`);
      await loadTasks();
    } catch (err) {
      updateTasksState((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: previousStatus } : t)));
      const msg = err.response?.data?.message || "Could not update status.";
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

  const handleTaskCardClick = (t) => {
    if (onTaskClick) {
      onTaskClick(t);
    } else {
      setActiveTask(t);
    }
  };

  const handleAddTaskBtnClick = () => {
    if (onAddTaskClick) {
      onAddTaskClick();
    } else {
      setShowCreateModal(true);
    }
  };

  return (
    <div style={{ animation: "fadeIn 0.2s ease" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Task Kanban</h2>
        <button
          className="btn btn-sm btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 6 }}
          onClick={handleAddTaskBtnClick}
        >
          <FiPlus /> Add Task
        </button>
      </div>

      {error && (
        <div className="card" style={{ background: "var(--color-danger-dim)", borderColor: "var(--color-danger)", color: "var(--color-danger)", padding: "12px 16px", marginBottom: 16, fontSize: 13.5 }}>
          {error}
        </div>
      )}

      <div className="kanban-board">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onTaskClick={handleTaskCardClick}
          />
        ))}
      </div>

      {/* Task Creation Modal */}
      {!isShared && showCreateModal && (
        <TaskModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onUpdated={loadTasks}
        />
      )}

      {/* Task Detail/Edit Modal */}
      {!isShared && activeTask && (
        <TaskModal
          task={activeTask}
          projectId={projectId}
          onClose={() => setActiveTask(null)}
          onUpdated={loadTasks}
        />
      )}
    </div>
  );
}