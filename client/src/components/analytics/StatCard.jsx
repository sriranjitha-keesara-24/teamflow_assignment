import React from "react";
import { FiTrendingUp, FiTrendingDown } from "react-icons/fi";

export default function StatCard({ title, value, icon: Icon, subtext, trend, trendValue }) {
  const isPositive = trend === "positive";
  const isNegative = trend === "negative";

  return (
    <div className="stat-card" style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "20px",
      borderRadius: "var(--radius-lg)",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      minHeight: "120px",
      boxShadow: "var(--shadow-sm)",
      transition: "transform var(--transition-base), box-shadow var(--transition-base)",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "var(--shadow-md), var(--shadow-glow)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--color-text-secondary)" }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "var(--radius-sm)",
            background: "var(--color-primary-dim)",
            color: "var(--color-primary-hover)",
          }}>
            <Icon size={16} />
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: "var(--color-text)" }}>
          {value}
        </span>
        {trendValue && (
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 2,
            fontSize: 12,
            fontWeight: 700,
            color: isPositive ? "var(--color-success)" : isNegative ? "var(--color-danger)" : "var(--color-warning)",
          }}>
            {isPositive ? <FiTrendingUp size={12} /> : isNegative ? <FiTrendingDown size={12} /> : null}
            {trendValue}
          </span>
        )}
      </div>

      {subtext && (
        <span style={{ fontSize: 11.5, color: "var(--color-text-muted)", marginTop: 6 }}>
          {subtext}
        </span>
      )}
    </div>
  );
}
