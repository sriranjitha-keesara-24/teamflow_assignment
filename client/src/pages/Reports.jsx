import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FiArrowLeft, FiActivity, FiFolder, FiCheckSquare, FiAlertCircle } from "react-icons/fi";
import { reportService } from "../services/reportService";
import { getProjectById } from "../services/projectService";
import StatCard from "../components/analytics/StatCard";
import {
  ProjectHealthWidget,
  TaskStatusChart,
  RCAStatusChart,
  TeamWorkloadChart,
  RcaTrendChart,
  CycleTimeChart,
  BurndownChartWidget,
  TeamTimeReportWidget,
} from "../components/analytics/ChartWidgets";
import ExportButton from "../components/analytics/ExportButton";
import toast from "react-hot-toast";
import api from "../services/api";

export default function Reports() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [advancedData, setAdvancedData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [projRes, reportRes, advancedRes] = await Promise.all([
        getProjectById(id),
        reportService.getDashboardReport(id),
        api.get(`/projects/${id}/reports/advanced`),
      ]);
      setProject(projRes.data || projRes.project);
      setReportData(reportRes.data || reportRes);
      setAdvancedData(advancedRes.data?.data || advancedRes.data);
    } catch (err) {
      toast.error("Failed to load project report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReportData();
    }
  }, [id]);

  const handleExportCSV = async (type = "tasks") => {
    try {
      const res = await reportService.exportProjectData(id, type);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `project-${project?.name || id}-${type}-report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${type.toUpperCase()} CSV export downloaded successfully`);
    } catch (err) {
      toast.error("Failed to export project data");
    }
  };

  if (loading) {
    return (
      <div className="loading-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!project || !reportData) {
    return (
      <div className="container" style={{ padding: 40, textAlign: "center" }}>
        <h3>Project not found</h3>
        <Link to="/projects" className="btn btn-primary" style={{ marginTop: 12 }}>
          Back to projects
        </Link>
      </div>
    );
  }

  const { health, taskStats = {}, rcaStats = {}, teamWorkload = [], rcaTrend = [] } = reportData;
  const { status = {}, completion = {}, overdue = 0 } = taskStats;
  const completionRate = completion?.rate ?? 0;

  return (
    <div className="container" style={{ paddingBottom: 60, animation: "fadeIn 0.35s ease" }}>
      <Link
        to={`/projects/${id}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-text-muted)",
          fontSize: 13.5,
          marginBottom: 20,
        }}
      >
        <FiArrowLeft size={14} /> Back to project details
      </Link>

      <div className="page-header" style={{ marginBottom: 28 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FiActivity size={22} style={{ color: "var(--color-primary-hover)" }} />
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800 }}>Project Reports & Analytics</h1>
          </div>
          <p className="page-subtitle" style={{ margin: "6px 0 0 0" }}>
            Performance reports, team workloads, incident trends and export utilities for {project.name}.
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stat-cards" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard
          title="Total Tasks"
          value={completion?.total ?? 0}
          icon={FiFolder}
          subtext="Total tasks created in project"
        />
        <StatCard
          title="Completed Tasks"
          value={completion?.completed ?? 0}
          icon={FiCheckSquare}
          subtext="Successfully completed tasks"
          trend="positive"
          trendValue={`${completionRate}% rate`}
        />
        <StatCard
          title="Overdue Tasks"
          value={overdue}
          icon={FiAlertCircle}
          subtext="Unfinished past due date"
          trend={overdue > 0 ? "negative" : "positive"}
          trendValue={overdue > 0 ? `${overdue} urgent` : "0 issues"}
        />
        <StatCard
          title="Active RCAs"
          value={rcaStats?.total ?? 0}
          icon={FiActivity}
          subtext="Root Cause Analyses created"
        />
      </div>

      {/* Charts Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, marginBottom: 28 }}>
        <ProjectHealthWidget health={health} />
        <TaskStatusChart data={status} />
        <RCAStatusChart data={rcaStats?.statuses} />
        <TeamWorkloadChart workload={teamWorkload} />

        {/* Advanced Manager Analytics Widgets */}
        {advancedData && (
          <>
            <CycleTimeChart cycleTime={advancedData.cycleTime} />
            <TeamTimeReportWidget timeReport={advancedData.timeReport} />
            <div style={{ gridColumn: "1 / -1" }}>
              <BurndownChartWidget burndown={advancedData.burndown} deadline={advancedData.deadline} />
            </div>
          </>
        )}

        <div style={{ gridColumn: "1 / -1" }}>
          <RcaTrendChart trend={rcaTrend} />
        </div>
      </div>

      {/* CSV Export panel */}
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12, background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: 22 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700 }}>Export Project Workspace Data</h3>
        <p style={{ color: "var(--color-text-muted)", fontSize: 13.5 }}>
          Export project tasks, checklists, priorities, and root cause analysis incident logs into formatted CSV files.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
          <ExportButton label="Download Tasks CSV" onExport={() => handleExportCSV("tasks")} type="primary" />
          <ExportButton label="Download RCA Logs CSV" onExport={() => handleExportCSV("rca")} type="secondary" />
        </div>
      </div>
    </div>
  );
}
