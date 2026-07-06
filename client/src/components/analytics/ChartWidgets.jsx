import React from "react";
import { FiUsers, FiFileText, FiActivity, FiTrendingUp } from "react-icons/fi";
import { getInitials } from "../../utils/formatters";

// 1. PROJECT HEALTH WIDGET
export function ProjectHealthWidget({ health = "On Track" }) {
  const healthColors = {
    "On Track": { text: "On Track", color: "var(--color-success)", bg: "var(--color-success-dim)", desc: "All deliverables are meeting deadlines." },
    "At Risk": { text: "At Risk", color: "var(--color-warning)", bg: "var(--color-warning-dim)", desc: "Some tasks are overdue. Attention needed." },
    "Delayed": { text: "Delayed", color: "var(--color-danger)", bg: "var(--color-danger-dim)", desc: "Critical path items are overdue." },
  };

  const current = healthColors[health] || healthColors["On Track"];

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      height: "320px",
      position: "relative",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary)", alignSelf: "flex-start", marginBottom: 20 }}>
        Project Health Status
      </h3>

      <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border)" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={current.color}
            strokeWidth="8"
            strokeDasharray="264"
            strokeDashoffset={health === "On Track" ? "0" : health === "At Risk" ? "80" : "160"}
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
            style={{ transition: "stroke-dashoffset 1s ease" }}
          />
        </svg>
        <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: 18, fontWeight: 800, color: current.color }}>{current.text}</span>
        </div>
      </div>

      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", maxWidth: "200px" }}>
        {current.desc}
      </p>
    </div>
  );
}

// 2. TASK STATUS DONUT CHART
export function TaskStatusChart({ data = {} }) {
  const statuses = ["Todo", "In Progress", "Review", "Completed"];
  const colors = {
    Todo: "#64748b",
    "In Progress": "#3b82f6",
    Review: "#f59e0b",
    Completed: "#22c55e",
  };

  const values = statuses.map((status) => data[status] || 0);
  const total = values.reduce((sum, val) => sum + val, 0);

  // Compute donut slices
  let accumulatedPercent = 0;
  const slices = statuses.map((status, idx) => {
    const value = data[status] || 0;
    if (total === 0) return { status, percent: 0, dashArray: "0 264", dashOffset: 0 };
    const percent = (value / total) * 100;
    const dashArray = `${(percent / 100) * 264} 264`;
    const dashOffset = -((accumulatedPercent / 100) * 264);
    accumulatedPercent += percent;
    return { status, percent, dashArray, dashOffset };
  });

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      height: "320px",
      display: "flex",
      flexDirection: "column",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 20 }}>
        Task Distribution
      </h3>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-around", flex: 1, gap: 16 }}>
        <div style={{ position: "relative", width: 130, height: 130, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {total === 0 ? (
            <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>No tasks</div>
          ) : (
            <svg width="100%" height="100%" viewBox="0 0 100 100">
              {slices.map((slice, idx) => {
                if (slice.percent === 0) return null;
                return (
                  <circle
                    key={slice.status}
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={colors[slice.status]}
                    strokeWidth="10"
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    transform="rotate(-90 50 50)"
                    style={{ transition: "all 0.5s ease" }}
                  />
                );
              })}
            </svg>
          )}
          <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ fontSize: 22, fontWeight: 800 }}>{total}</span>
            <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>total</span>
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: "120px" }}>
          {statuses.map((status) => {
            const count = data[status] || 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={status} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: colors[status] }} />
                <span style={{ fontWeight: 600, flex: 1 }}>{status}</span>
                <span style={{ color: "var(--color-text-muted)" }}>{count} ({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// 3. RCA STATUS BAR CHART
export function RCAStatusChart({ data = {} }) {
  const rcaStatuses = ["Draft", "Submitted", "Under Review", "Approved", "Rejected", "Needs Revision"];
  const colors = {
    Draft: "#64748b",
    Submitted: "#3b82f6",
    "Under Review": "#8b5cf6",
    Approved: "#22c55e",
    Rejected: "#ef4444",
    "Needs Revision": "#f59e0b",
  };

  const values = rcaStatuses.map((status) => data[status] || 0);
  const maxVal = Math.max(...values, 1);

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      height: "320px",
      display: "flex",
      flexDirection: "column",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 20 }}>
        RCA Reports Status Breakdown
      </h3>

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flex: 1, height: "180px", padding: "0 10px" }}>
        {rcaStatuses.map((status) => {
          const count = data[status] || 0;
          const heightPercent = (count / maxVal) * 100;
          return (
            <div key={status} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "14%", gap: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 700 }}>{count}</div>
              <div style={{
                width: "100%",
                height: `${Math.max(heightPercent * 1.3, 4)}px`,
                maxHeight: "130px",
                background: colors[status],
                borderRadius: "4px 4px 0 0",
                transition: "height 0.8s ease",
              }} />
              <div style={{
                fontSize: 10,
                color: "var(--color-text-muted)",
                textAlign: "center",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                width: "100%",
              }} title={status}>
                {status}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 4. TEAM WORKLOAD PROGRESS LIST
export function TeamWorkloadChart({ workload = [] }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      height: "320px",
      display: "flex",
      flexDirection: "column",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        Team Task Workload
      </h3>

      <div style={{ overflowY: "auto", flex: 1, paddingRight: 4, display: "flex", flexDirection: "column", gap: 14 }}>
        {workload.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
            No task assignments recorded for this project yet.
          </div>
        ) : (
          workload.map((member) => {
            const total = member.totalTasks || 0;
            const completed = member.completedTasks || 0;
            const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={member.userId} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="avatar avatar-xs" style={{ fontSize: 9, width: 22, height: 22 }}>
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                      ) : (
                        getInitials(member.name)
                      )}
                    </div>
                    <span style={{ fontWeight: 650, color: "var(--color-text)" }}>{member.name}</span>
                  </div>
                  <span style={{ color: "var(--color-text-secondary)", fontWeight: 600 }}>
                    {completed}/{total} tasks ({percent}%)
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{ height: 8, width: "100%", background: "var(--color-border)", borderRadius: 4, overflow: "hidden", display: "flex" }}>
                  <div style={{ width: `${percent}%`, background: "var(--color-success)", borderRadius: 4, transition: "width 0.8s ease" }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 5. RCA TREND LINE CHART
export function RcaTrendChart({ trend = [] }) {
  const maxCount = Math.max(...trend.map((t) => t.count), 1);
  const dataPoints = trend.length;

  // Render SVG Line path
  const width = 500;
  const height = 140;
  const paddingX = 40;
  const paddingY = 20;

  let points = "";
  let areaPoints = "";
  if (dataPoints > 1) {
    points = trend
      .map((t, idx) => {
        const x = paddingX + (idx / (dataPoints - 1)) * (width - 2 * paddingX);
        const y = height - paddingY - (t.count / maxCount) * (height - 2 * paddingY);
        return `${x},${y}`;
      })
      .join(" ");

    // For area gradient path
    const firstX = paddingX;
    const lastX = width - paddingX;
    areaPoints = `${firstX},${height - paddingY} ${points} ${lastX},${height - paddingY}`;
  }

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      height: "320px",
      display: "flex",
      flexDirection: "column",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 12 }}>
        Incident Frequency Trend (RCA)
      </h3>

      {trend.length < 2 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
          <FiActivity size={24} style={{ marginRight: 8 }} />
          Not enough historical incident data to plot trends.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ position: "relative", flex: 1, width: "100%" }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="var(--color-border)" strokeWidth="1" />

              {/* Area path */}
              <polygon points={areaPoints} fill="url(#areaGradient)" />

              {/* Polyline */}
              <polyline fill="none" stroke="var(--color-accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />

              {/* Data points */}
              {trend.map((t, idx) => {
                const x = paddingX + (idx / (dataPoints - 1)) * (width - 2 * paddingX);
                const y = height - paddingY - (t.count / maxCount) * (height - 2 * paddingY);
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="5" fill="var(--color-bg)" stroke="var(--color-accent)" strokeWidth="2.5" />
                    <title>{`${t.date}: ${t.count} incidents`}</title>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* X Axis dates */}
          <div style={{ display: "flex", justifyContent: "space-between", padding: `0 ${paddingX}px`, fontSize: 10, color: "var(--color-text-muted)", marginTop: 6 }}>
            <span>{trend[0].date}</span>
            <span>{trend[trend.length - 1].date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 6. CYCLE TIME CHART WIDGET
export function CycleTimeChart({ cycleTime = {} }) {
  const statuses = ["Todo", "In Progress", "Review"];
  const colors = {
    Todo: "#64748b",
    "In Progress": "#3b82f6",
    Review: "#f59e0b"
  };

  const values = statuses.map(s => cycleTime[s] || 0);
  const maxVal = Math.max(...values, 1);

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      height: "320px",
      display: "flex",
      flexDirection: "column",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 20 }}>
        Average Cycle Time per Status Column (Days)
      </h3>

      <div style={{ display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "center", flex: 1, gap: 20 }}>
        {statuses.map(status => {
          const val = cycleTime[status] || 0;
          const pct = Math.max(8, (val / maxVal) * 100);
          return (
            <div key={status} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 85, fontSize: 12, fontWeight: 650, color: "var(--color-text-secondary)" }}>
                {status}
              </div>
              <div style={{ flex: 1, height: 24, background: "var(--color-surface-hover)", borderRadius: 12, overflow: "hidden", position: "relative" }}>
                <div style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: colors[status],
                  borderRadius: 12,
                  transition: "width 0.8s ease",
                  display: "flex",
                  alignItems: "center",
                  paddingLeft: 10,
                  boxSizing: "border-box"
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                    {val} day{val !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 7. PROJECT BURNDOWN CHART (SVG)
export function BurndownChartWidget({ burndown = [], deadline }) {
  const openCounts = burndown.map(b => b.openTasks || 0);
  const maxVal = Math.max(...openCounts, 5);

  const width = 500;
  const height = 150;
  const paddingX = 40;
  const paddingY = 20;

  const dataPoints = burndown.length;

  // Actual burndown path
  let points = "";
  if (dataPoints > 1) {
    points = burndown
      .map((b, idx) => {
        const x = paddingX + (idx / (dataPoints - 1)) * (width - 2 * paddingX);
        const y = height - paddingY - (b.openTasks / maxVal) * (height - 2 * paddingY);
        return `${x},${y}`;
      })
      .join(" ");
  }

  // Ideal burndown path (linear guide)
  const initialValue = openCounts[0] || 0;
  const idealPoints = dataPoints > 1 ? [
    `${paddingX},${height - paddingY - (initialValue / maxVal) * (height - 2 * paddingY)}`,
    `${width - paddingX},${height - paddingY}`
  ].join(" ") : "";

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      height: "320px",
      display: "flex",
      flexDirection: "column",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary)", margin: 0 }}>
          Project Burndown Timeline (14 Days)
        </h3>
        {deadline && (
          <span style={{ fontSize: 11, background: "var(--color-primary-dim)", color: "var(--color-primary-hover)", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>
            Deadline: {new Date(deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      {burndown.length < 2 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
          No burndown data recorded yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ position: "relative", flex: 1, width: "100%" }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="var(--color-border)" strokeWidth="1" />

              {/* Ideal linear burndown path */}
              {idealPoints && (
                <polyline fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5" strokeDasharray="4 4" points={idealPoints} />
              )}

              {/* Actual burndown path */}
              {points && (
                <polyline fill="none" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
              )}

              {/* Data points */}
              {burndown.map((b, idx) => {
                const x = paddingX + (idx / (dataPoints - 1)) * (width - 2 * paddingX);
                const y = height - paddingY - (b.openTasks / maxVal) * (height - 2 * paddingY);
                return (
                  <g key={idx}>
                    <circle cx={x} cy={y} r="4.5" fill="var(--color-bg)" stroke="var(--color-primary)" strokeWidth="2.5" />
                    <title>{`${b.date}: ${b.openTasks} open tasks`}</title>
                  </g>
                );
              })}
            </svg>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", padding: `0 ${paddingX}px`, fontSize: 10, color: "var(--color-text-muted)", marginTop: 6 }}>
            <span>{burndown[0].date}</span>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, background: "var(--color-primary)", borderRadius: "50%" }} /> Actual
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, border: "1px dashed var(--color-text-muted)", background: "transparent", borderRadius: "50%" }} /> Ideal Guide
              </span>
            </div>
            <span>{burndown[burndown.length - 1].date}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// 8. TEAM TIME SPENT CHART WIDGET
export function TeamTimeReportWidget({ timeReport = [] }) {
  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      height: "320px",
      display: "flex",
      flexDirection: "column",
    }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-text-secondary)", marginBottom: 16 }}>
        Team Logged Hours (Time Tracking)
      </h3>

      <div style={{ overflowY: "auto", flex: 1, paddingRight: 4, display: "flex", flexDirection: "column", gap: 14 }}>
        {timeReport.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)", fontSize: 13 }}>
            No time tracked on this project tasks yet.
          </div>
        ) : (
          timeReport.map((member, idx) => {
            const hrs = member.totalHours || 0;
            return (
              <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div className="avatar avatar-xs" style={{ fontSize: 9, width: 22, height: 22 }}>
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      getInitials(member.name)
                    )}
                  </div>
                  <span style={{ fontWeight: 650, color: "var(--color-text)" }}>{member.name}</span>
                </div>
                <div style={{ color: "var(--color-primary-hover)", fontWeight: 700, fontSize: 13 }}>
                  {hrs} hr{hrs !== 1 ? 's' : ''} logged
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
