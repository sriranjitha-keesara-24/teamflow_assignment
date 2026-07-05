import { useEffect, useState } from "react";
import { getProjectById, addMember, updateMemberRole, removeMember, searchUsers } from "../../services/projectService";
import { getInitials } from "../../utils/formatters";
import toast from "react-hot-toast";

const ROLES = ["Manager", "Developer", "Viewer"];

export default function MemberList({ projectId, currentUserId, canManage }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("Developer");

  // Search autocomplete states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const res = await getProjectById(projectId);
      setMembers(res.data?.members || res.project?.members || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleSearchChange = async (val) => {
    setSearchQuery(val);
    setSelectedUser(null);
    setNewUserId("");

    if (!val.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    try {
      const res = await searchUsers(val);
      const existingUserIds = members.map((m) => m.user?._id);
      const filteredUsers = (res.users || []).filter(
        (u) => !existingUserIds.includes(u._id)
      );
      setSearchResults(filteredUsers);
      setShowDropdown(true);
    } catch (err) {
      console.error("Failed to search users", err);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchQuery(user.name);
    setNewUserId(user._id);
    setShowDropdown(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const targetUserId = newUserId.trim();
    if (!targetUserId) {
      toast.error("Please search and select a user to add");
      return;
    }
    try {
      setError("");
      const data = await addMember(projectId, targetUserId, newRole);
      setMembers(data.data?.members || data.project?.members || data.members || []);
      setNewUserId("");
      setSearchQuery("");
      setSelectedUser(null);
      toast.success("Team member added");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to add member.";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this member from the project?")) return;
    try {
      setError("");
      const data = await removeMember(projectId, userId);
      setMembers(data.data?.members || data.project?.members || data.members || []);
      toast.success("Team member removed");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to remove member.";
      setError(msg);
      toast.error(msg);
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      setError("");
      const data = await updateMemberRole(projectId, userId, role);
      setMembers(data.data?.members || data.project?.members || data.members || []);
      toast.success("Member role updated");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update role.";
      setError(msg);
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <h3 className="member-section-title">Project Team</h3>

      {error && (
        <div className="badge badge-priority-critical" style={{ padding: "8px 12px", width: "100%", borderRadius: "var(--radius-md)" }}>
          {error}
        </div>
      )}

      <ul className="member-list" style={{ listStyle: "none" }}>
        {members.map((m) => {
          if (!m.user) return null;
          return (
            <li key={m.user._id} className="member-row">
              <div className="avatar" style={{ fontSize: 11 }}>
                {getInitials(m.user.name)}
              </div>
              <div className="member-info">
                <div className="member-name">{m.user.name}</div>
                <div className="member-email">{m.user.email}</div>
              </div>

              <div className="member-actions" style={{ alignItems: "center" }}>
                {canManage && m.user._id !== currentUserId ? (
                  <>
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.user._id, e.target.value)}
                      style={{ padding: "4px 8px", fontSize: 12, marginRight: 8 }}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-xs btn-secondary"
                      style={{ color: "var(--color-danger)" }}
                      onClick={() => handleRemove(m.user._id)}
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <span className="member-role-badge">{m.role}</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {canManage && (
        <form onSubmit={handleAdd} className="add-member-form" style={{ position: "relative" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input
              type="text"
              placeholder="Search user by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              onBlur={() => {
                // Delay dropdown closing slightly to allow option click to trigger
                setTimeout(() => setShowDropdown(false), 200);
              }}
              style={{ width: "100%", padding: "8px 12px", fontSize: 13 }}
            />

            {showDropdown && searchResults.length > 0 && (
              <div className="autocomplete-dropdown">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="autocomplete-option"
                    onClick={() => handleSelectUser(user)}
                  >
                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-text-muted)" }}>{user.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            style={{ padding: "8px 12px", fontSize: 13 }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" className="btn btn-sm btn-primary">
            Add
          </button>
        </form>
      )}
    </div>
  );
}