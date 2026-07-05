import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchService } from "../../services/searchService";
import { FiSearch, FiFolder, FiCheckSquare, FiActivity, FiX } from "react-icons/fi";
import "../../styles/rca.css"; // Includes search modal styling

const SearchModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ projects: [], tasks: [], rcas: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Auto-focus search input
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  // Trigger search on query change (with debounce)
  useEffect(() => {
    if (!query.trim()) {
      setResults({ projects: [], tasks: [], rcas: [] });
      return;
    }
    const delay = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchService.globalSearch(query);
        setResults(data);
      } catch (err) {
        console.error("Global search failed", err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delay);
  }, [query]);

  // Click outside to close modal
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  const hasResults =
    results.projects.length > 0 ||
    results.tasks.length > 0 ||
    results.rcas.length > 0;

  return (
    <div className="search-modal-overlay">
      <div className="search-modal" ref={modalRef}>
        <div className="search-modal-input-wrap">
          <FiSearch size={18} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tasks, projects, RCAs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button onClick={onClose} style={{ color: "var(--color-text-muted)" }}>
            <FiX size={18} />
          </button>
        </div>

        <div className="search-results">
          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: 24 }}>
              <div className="spinner" />
            </div>
          ) : query && !hasResults ? (
            <div className="search-empty">
              No results found for "<strong>{query}</strong>"
            </div>
          ) : !query ? (
            <div className="search-empty" style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
              Type to start searching across projects, tasks, and root cause analyses...
            </div>
          ) : (
            <>
              {/* Projects Group */}
              {results.projects.length > 0 && (
                <div className="search-results-group">
                  <div className="search-results-label">Projects</div>
                  {results.projects.map((p) => (
                    <div
                      key={p._id}
                      className="search-result-item"
                      onClick={() => handleNavigate(`/projects/${p._id}`)}
                    >
                      <div className="search-result-icon" style={{ background: "var(--color-primary-dim)", color: "var(--color-primary)" }}>
                        <FiFolder size={14} />
                      </div>
                      <div>
                        <div className="search-result-title">{p.name}</div>
                        <div className="search-result-subtitle">{p.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tasks Group */}
              {results.tasks.length > 0 && (
                <div className="search-results-group">
                  <div className="search-results-label">Tasks</div>
                  {results.tasks.map((t) => (
                    <div
                      key={t._id}
                      className="search-result-item"
                      onClick={() => handleNavigate(`/tasks/${t._id}`)}
                    >
                      <div className="search-result-icon" style={{ background: "var(--color-info-dim)", color: "var(--color-info)" }}>
                        <FiCheckSquare size={14} />
                      </div>
                      <div>
                        <div className="search-result-title">{t.title}</div>
                        <div className="search-result-subtitle">Project: {t.project?.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RCAs Group */}
              {results.rcas.length > 0 && (
                <div className="search-results-group">
                  <div className="search-results-label">Root Cause Analyses</div>
                  {results.rcas.map((r) => (
                    <div
                      key={r._id}
                      className="search-result-item"
                      onClick={() => handleNavigate(`/rca/${r._id}`)}
                    >
                      <div className="search-result-icon" style={{ background: "var(--color-warning-dim)", color: "var(--color-warning)" }}>
                        <FiActivity size={14} />
                      </div>
                      <div>
                        <div className="search-result-title">{r.title}</div>
                        <div className="search-result-subtitle">Project: {r.project?.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchModal;
