import { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiCalendar } from "react-icons/fi";
import { priorityBadgeClass } from "../../utils/formatters";

export default function CalendarView({ tasks, onTaskClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Helper to get number of days in the month
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  // Helper to get the day of the week the first of the month falls on (0 = Sun, 6 = Sat)
  const getFirstDayOfMonth = (y, m) => new Date(y, m, 1).getDay();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const today = () => {
    setCurrentDate(new Date());
  };

  // Generate the day cells for the monthly grid
  const cells = [];
  // Fill the leading empty cells with previous month's ending days
  const prevMonthDaysCount = getDaysInMonth(year, month - 1);
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: prevMonthDaysCount - i,
      isCurrentMonth: false,
      date: new Date(year, month - 1, prevMonthDaysCount - i)
    });
  }

  // Current month's days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      isCurrentMonth: true,
      date: new Date(year, month, d)
    });
  }

  // Fill trailing days to align to grid
  const remainingCells = 42 - cells.length; // 6 rows of 7 days
  for (let i = 1; i <= remainingCells; i++) {
    cells.push({
      day: i,
      isCurrentMonth: false,
      date: new Date(year, month + 1, i)
    });
  }

  // Compare if two dates fall on the same day
  const isSameDay = (dateA, dateB) => {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
  };

  const isToday = (date) => isSameDay(date, new Date());

  // Get tasks assigned to a specific date
  const getTasksForDate = (date) => {
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const taskDate = new Date(t.dueDate);
      return isSameDay(taskDate, date);
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Calendar Header Nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
          <FiCalendar style={{ color: "var(--color-primary)" }} />
          {monthNames[month]} {year}
        </h2>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-xs btn-secondary" onClick={today}>
            Today
          </button>
          <button
            className="btn btn-xs btn-secondary"
            onClick={prevMonth}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}
          >
            <FiChevronLeft size={16} />
          </button>
          <button
            className="btn btn-xs btn-secondary"
            onClick={nextMonth}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "0 8px" }}
          >
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Week Day Labels */}
      <div className="calendar-grid-header" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontWeight: 700, fontSize: 12, textTransform: "uppercase", color: "var(--color-text-secondary)", borderBottom: "1px solid var(--color-border)", paddingBottom: 8 }}>
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Calendar Grid Cells */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(110px, auto)", gap: 1, background: "var(--color-border)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
        {cells.map((cell, idx) => {
          const dateTasks = getTasksForDate(cell.date);
          const cellToday = isToday(cell.date);

          return (
            <div
              key={idx}
              style={{
                background: cellToday
                  ? "var(--color-primary-dim)"
                  : cell.isCurrentMonth
                  ? "var(--color-surface)"
                  : "var(--color-bg)",
                padding: 8,
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minHeight: 110,
                opacity: cell.isCurrentMonth ? 1 : 0.45,
                border: cellToday ? "1px solid var(--color-primary)" : "none",
              }}
            >
              {/* Day Number Label */}
              <div
                style={{
                  alignSelf: "flex-end",
                  fontSize: 12,
                  fontWeight: cellToday || cell.isCurrentMonth ? 700 : 400,
                  color: cellToday
                    ? "var(--color-primary)"
                    : cell.isCurrentMonth
                    ? "var(--color-text)"
                    : "var(--color-text-muted)",
                  background: cellToday ? "var(--color-primary-dim)" : "transparent",
                  padding: cellToday ? "2px 6px" : 0,
                  borderRadius: cellToday ? "var(--radius-sm)" : 0,
                }}
              >
                {cell.day}
              </div>

              {/* Day Tasks List */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1, overflowY: "auto" }}>
                {dateTasks.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => onTaskClick(t)}
                    style={{
                      padding: "4px 6px",
                      borderRadius: "var(--radius-xs)",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      borderLeft: `3px solid var(--color-text-muted)`,
                      background: "var(--color-surface-hover)",
                      boxShadow: "var(--shadow-sm)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    className={`calendar-task-item ${t.priority}`}
                    title={`${t.title} (${t.status})`}
                  >
                    {t.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
