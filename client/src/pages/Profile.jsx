import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import { updateUserProfile, logoutUser, uploadAvatar } from "../services/authService";
import {
  FiEdit2,
  FiCheck,
  FiCamera,
  FiLock,
  FiBell,
  FiShield,
  FiGlobe,
  FiHelpCircle,
  FiLogOut,
  FiChevronRight,
  FiArrowLeft
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  // Helper to get full avatar URL if uploaded locally
  const getAvatarUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1";
    const serverHost = apiBase.replace("/api/v1", "");
    return `${serverHost}${path}`;
  };

  // Profile data states
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [skills, setSkills] = useState(user?.skills || []);

  // Editing toggle states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  // Form input buffer states
  const [nameInput, setNameInput] = useState(name);
  const [bioInput, setBioInput] = useState(bio);
  const [phoneInput, setPhoneInput] = useState(phone);
  const [skillsInput, setSkillsInput] = useState(Array.isArray(skills) ? skills.join(", ") : "");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setPhone(user.phone || "");
      setAvatar(user.avatar || "");
      setSkills(user.skills || []);
    }
  }, [user]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setLoading(true);
    try {
      const res = await uploadAvatar(formData);
      setUser(res.user);
      setAvatar(res.user.avatar || "");
      toast.success("Profile photo updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload avatar");
    } finally {
      setLoading(false);
    }
  };

  const saveField = async (fieldName, val) => {
    setLoading(true);
    try {
      const payload = {
        name: fieldName === "name" ? val : name,
        bio: fieldName === "bio" ? val : bio,
        phone: fieldName === "phone" ? val : phone,
        skills: fieldName === "skills" ? val : skills.join(", "),
        avatar,
      };

      const res = await updateUserProfile(payload);
      setUser(res.user);

      // Update local states on success
      if (fieldName === "name") {
        setName(res.user.name);
        setIsEditingName(false);
      }
      if (fieldName === "bio") {
        setBio(res.user.bio || "");
        setIsEditingBio(false);
      }
      if (fieldName === "phone") {
        setPhone(res.user.phone || "");
        setIsEditingPhone(false);
      }
      if (fieldName === "skills") {
        setSkills(res.user.skills || []);
        setIsEditingSkills(false);
      }
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
      navigate("/login");
    }
  };

  return (
    <div className="container" style={{ padding: "30px 24px 80px", maxWidth: 640, animation: "fadeIn 0.3s ease" }}>
      {/* Local page Styles */}
      <style>{`
        .profile-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
        }
        .profile-avatar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          margin: 10px 0 20px;
        }
        .profile-avatar-circle {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: #1e2640;
          border: 1px solid var(--color-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          color: var(--color-primary-hover);
          overflow: hidden;
          position: relative;
        }
        .profile-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .profile-avatar-camera-btn {
          position: absolute;
          bottom: 0;
          right: 0;
          background: #1a2236;
          border: 1px solid var(--color-border);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .profile-avatar-camera-btn:hover {
          background: var(--color-surface-hover);
          color: var(--color-text);
        }
        .profile-user-name {
          font-size: 20px;
          font-weight: 700;
          text-align: center;
          margin-top: 10px;
          color: var(--color-text);
        }
        .profile-user-email {
          font-size: 13.5px;
          color: var(--color-text-muted);
          text-align: center;
          margin-top: 4px;
          margin-bottom: 24px;
        }
        .profile-settings-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: 14px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .profile-settings-row {
          border-bottom: 1px solid var(--color-border);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: background 0.2s;
        }
        .profile-settings-row:last-child {
          border-bottom: none;
        }
        .profile-settings-row-interactive {
          cursor: pointer;
        }
        .profile-settings-row-interactive:hover {
          background: var(--color-surface-hover);
        }
        .profile-settings-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .profile-settings-label {
          font-size: 11.5px;
          font-weight: 600;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .profile-settings-value {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text);
        }
        .profile-edit-btn {
          color: var(--color-text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          transition: background 0.2s, color 0.2s;
        }
        .profile-edit-btn:hover {
          background: rgba(255,255,255,0.06);
          color: var(--color-text);
        }
        .profile-section-title {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          margin-bottom: 10px;
          padding-left: 6px;
          letter-spacing: 0.05em;
        }
        .profile-row-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .profile-row-icon {
          color: var(--color-text-muted);
          display: flex;
        }
        .profile-row-text {
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text);
        }
        .profile-input-edit {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .profile-input-edit input {
          flex: 1;
          background: #1a2236;
          border: 1px solid var(--color-border);
          color: #e8eaf0;
          padding: 8px 12px;
          font-size: 14px;
          border-radius: 6px;
        }
        .profile-input-btn {
          padding: 8px 12px;
          background: var(--color-primary);
          border-radius: 6px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: none;
        }
      `}</style>

      {/* Back Button & Header */}
      <div className="profile-page-header">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", color: "var(--color-text-secondary)" }}
        >
          <FiArrowLeft /> Back
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Profile Settings</h1>
      </div>

      {/* Profile Avatar section */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar-circle">
            {avatar ? (
              <img src={getAvatarUrl(avatar)} alt="Avatar" className="profile-avatar-img" />
            ) : (
              name.substring(0, 1).toUpperCase()
            )}
          </div>
          <button
            className="profile-avatar-camera-btn"
            onClick={() => document.getElementById("profile-avatar-file-input").click()}
            disabled={loading}
            title="Upload photo"
          >
            <FiCamera size={14} />
          </button>
          <input
            type="file"
            id="profile-avatar-file-input"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <div className="profile-user-name">{name}</div>
        <div className="profile-user-email">{user?.email}</div>
      </div>

      {/* Editable details container */}
      <div className="profile-settings-card">
        {/* About detail row */}
        <div className="profile-settings-row">
          {isEditingBio ? (
            <div className="profile-input-edit">
              <input
                type="text"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                maxLength={100}
              />
              <button className="profile-input-btn" onClick={() => saveField("bio", bioInput)}>
                <FiCheck size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="profile-settings-content">
                <span className="profile-settings-label">About</span>
                <span className="profile-settings-value">{bio}</span>
              </div>
              <button className="profile-edit-btn" onClick={() => { setBioInput(bio); setIsEditingBio(true); }}>
                <FiEdit2 size={14} />
              </button>
            </>
          )}
        </div>

        {/* Name detail row */}
        <div className="profile-settings-row">
          {isEditingName ? (
            <div className="profile-input-edit">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
              />
              <button className="profile-input-btn" onClick={() => saveField("name", nameInput)}>
                <FiCheck size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="profile-settings-content">
                <span className="profile-settings-label">Name</span>
                <span className="profile-settings-value">{name}</span>
              </div>
              <button className="profile-edit-btn" onClick={() => { setNameInput(name); setIsEditingName(true); }}>
                <FiEdit2 size={14} />
              </button>
            </>
          )}
        </div>

        {/* Phone detail row */}
        <div className="profile-settings-row">
          {isEditingPhone ? (
            <div className="profile-input-edit">
              <input
                type="text"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
              />
              <button className="profile-input-btn" onClick={() => saveField("phone", phoneInput)}>
                <FiCheck size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="profile-settings-content">
                <span className="profile-settings-label">Phone</span>
                <span className="profile-settings-value">{phone || "Not set"}</span>
              </div>
              <button className="profile-edit-btn" onClick={() => { setPhoneInput(phone); setIsEditingPhone(true); }}>
                <FiEdit2 size={14} />
              </button>
            </>
          )}
        </div>

        {/* Skills detail row */}
        <div className="profile-settings-row">
          {isEditingSkills ? (
            <div className="profile-input-edit">
              <input
                type="text"
                placeholder="React, Node, CSS (comma separated)"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />
              <button className="profile-input-btn" onClick={() => saveField("skills", skillsInput)}>
                <FiCheck size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="profile-settings-content">
                <span className="profile-settings-label">Skills</span>
                <span className="profile-settings-value">
                  {skills && skills.length > 0 ? skills.join(", ") : "No skills added"}
                </span>
              </div>
              <button className="profile-edit-btn" onClick={() => { setSkillsInput(skills ? skills.join(", ") : ""); setIsEditingSkills(true); }}>
                <FiEdit2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Account category card */}
      <div className="profile-section-title">Account</div>
      <div className="profile-settings-card">
        <div className="profile-settings-row profile-settings-row-interactive">
          <div className="profile-row-left">
            <span className="profile-row-icon"><FiLock size={17} /></span>
            <span className="profile-row-text">Privacy</span>
          </div>
          <FiChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
        </div>

        <div className="profile-settings-row profile-settings-row-interactive" onClick={() => navigate("/notifications")}>
          <div className="profile-row-left">
            <span className="profile-row-icon"><FiBell size={17} /></span>
            <span className="profile-row-text">Notifications</span>
          </div>
          <FiChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
        </div>

        <div className="profile-settings-row profile-settings-row-interactive">
          <div className="profile-row-left">
            <span className="profile-row-icon"><FiShield size={17} /></span>
            <span className="profile-row-text">Security</span>
          </div>
          <FiChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
        </div>

        <div className="profile-settings-row profile-settings-row-interactive">
          <div className="profile-row-left">
            <span className="profile-row-icon"><FiGlobe size={17} /></span>
            <span className="profile-row-text">App language</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, color: "var(--color-text-muted)" }}>English</span>
            <FiChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
          </div>
        </div>
      </div>

      {/* Support category card */}
      <div className="profile-section-title">Support</div>
      <div className="profile-settings-card">
        <div className="profile-settings-row profile-settings-row-interactive">
          <div className="profile-row-left">
            <span className="profile-row-icon"><FiHelpCircle size={17} /></span>
            <span className="profile-row-text">Help</span>
          </div>
          <FiChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
        </div>

        <div className="profile-settings-row profile-settings-row-interactive" onClick={handleLogout}>
          <div className="profile-row-left" style={{ color: "var(--color-danger)" }}>
            <span className="profile-row-icon" style={{ color: "var(--color-danger)" }}><FiLogOut size={17} /></span>
            <span className="profile-row-text" style={{ color: "var(--color-danger)" }}>Log out</span>
          </div>
          <FiChevronRight size={16} style={{ color: "var(--color-text-muted)" }} />
        </div>
      </div>
    </div>
  );
}
