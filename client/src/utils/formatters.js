export const statusBadgeClass = (status) => {
    const map = {
        Active: "badge-active",
        "On Hold": "badge-onhold",
        Completed: "badge-completed",
        Archived: "badge-archived",
    };
    return `badge ${map[status] || "badge-active"}`;
};

export const priorityBadgeClass = (priority) => {
    const map = {
        Low: "badge-priority-low",
        Medium: "badge-priority-medium",
        High: "badge-priority-high",
        Critical: "badge-priority-critical",
    };
    return `badge ${map[priority] || "badge-priority-medium"}`;
};

export const formatDate = (dateStr) => {
    if (!dateStr) return "No deadline";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export const getInitials = (name = "") => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
};