import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { rcaService } from "../services/rcaService";
import { formatDate } from "../utils/formatters";
import { FiActivity, FiUser, FiFolder, FiCheckSquare } from "react-icons/fi";
import toast from "react-hot-toast";
import "../styles/rca.css";

const STATUS_FILTERS = ["All", "Draft", "Submitted", "Under Review", "Approved", "Rejected", "Needs Revision"];

const RCAList = () => {
  const navigate = useNavigate();
  const [rcas, setRcas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchRCAs = async () => {
    setLoading(true);
    try {
      const res = await rcaService.getAll();
      let list = res.data || [];
      if (activeFilter !== "All") {
        list = list.filter((r) => r.status === activeFilter);
      }
      setRcas(list);
    } catch (err) {
      toast.error("Could not fetch RCA logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRCAs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter]);

  return (
    <div className="container" style={{ paddingBottom: 60, animation: "fadeIn 0.35s ease" }}>
      <div className="page-header">
        <div>
          <h1>Root Cause Analysis Logs</h1>
          <p className="page-subtitle">Inspect, review, and approve root cause analyses for system incidents</p>
        </div>
      </div>

      {/* Filter Tabs */}
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

      {/* RCA list cards */}
      {loading ? (
        <div className="loading-center">
          <div className="spinner" />
        </div>
      ) : rcas.length === 0 ? (
        <div className="empty-state">
          <FiActivity size={36} style={{ marginBottom: 12, color: "var(--color-text-muted)" }} />
          <h3>No RCA logs found</h3>
          <p>There are no root cause analysis logs matching the status "{activeFilter}".</p>
        </div>
      ) : (
        <div className="rca-list">
          {rcas.map((rca) => (
            <div
              key={rca._id}
              className="rca-card"
              onClick={() => navigate(`/rca/${rca._id}`)}
            >
              <div className={`rca-status-indicator ${rca.status}`} />
              <div className="rca-card-content">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 4 }}>
                  <h3 className="rca-card-title">{rca.title}</h3>
                  <span className={`rca-status-badge ${rca.status.replace(" ", "-")}`}>
                    {rca.status}
                  </span>
                </div>
                <p className="rca-card-excerpt">{rca.incidentDescription}</p>
                
                <div className="rca-card-meta">
                  <div className="rca-card-meta-item">
                    <FiFolder size={13} />
                    <span>Project: {rca.project?.name}</span>
                  </div>
                  {rca.task && (
                    <div className="rca-card-meta-item">
                      <FiCheckSquare size={13} />
                      <span>Task: {rca.task?.title}</span>
                    </div>
                  )}
                  <div className="rca-card-meta-item">
                    <FiUser size={13} />
                    <span>Author: {rca.submitter?.name}</span>
                  </div>
                  <div className="rca-card-meta-item" style={{ marginLeft: "auto" }}>
                    {formatDate(rca.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RCAList;
