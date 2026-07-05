import { useState } from "react";
import TaskCard from "./TaskCard";

export default function KanbanColumn({ status, tasks, onDrop, onDragStart, onTaskClick }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/task-id");
    if (taskId) onDrop(taskId, status);
  };

  const getStatusClass = (s) => {
    return s.toLowerCase().replace(" ", "");
  };

  return (
    <div className="kanban-column">
      <div className="kanban-column-header">
        <h3 className="kanban-column-title">
          <span className={`kanban-column-dot ${getStatusClass(status)}`} />
          {status}
        </h3>
        <span className="kanban-column-count">{tasks.length}</span>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`kanban-cards ${isDragOver ? "drag-over" : ""}`}
      >
        {tasks.map((task) => (
          <TaskCard key={task._id} task={task} onClick={onTaskClick} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}