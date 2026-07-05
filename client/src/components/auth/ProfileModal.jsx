import { useState } from "react";
import useAuth from "../../hooks/useAuth";
import { updateUserProfile, logoutAllDevices } from "../../services/authService";
import { FiX, FiEdit2, FiCheck, FiCamera, FiSmile, FiLogOut } from "react-icons/fi";
import toast from "react-hot-toast";

export default function ProfileModal({ onClose }) {
  const { user, setUser } = useAuth();

  // Profile data states
  const [name, setName] = useState(user?.name || "Honey");
  const [bio, setBio] = useState(user?.bio || "Share a thought");
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [skills, setSkills] = useState(user?.skills?.join(", ") || "");

  // Editing toggle states
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  // Form input buffer states
  const [nameInput, setNameInput] = useState(name);
  const [bioInput, setBioInput] = useState(bio);
  const [avatarInput, setAvatarInput] = useState(avatar);
  const [skillsInput, setSkillsInput] = useState(skills);

  const [loading, setLoading] = useState(false);

  const saveField = async (fieldName, val) => {
    setLoading(true);
    try {
      const payload = {
        name: fieldName === "name" ? val : name,
        bio: fieldName === "bio" ? val : bio,
        avatar: fieldName === "avatar" ? val : avatar,
        skills: fieldName === "skills" ? val : skills,
      };

      const res = await updateUserProfile(payload);
      setUser(res.user);
      
      // Update local states on success
      if (fieldName === "name") {
        setName(res.user.name);
        setIsEditingName(false);
      }
      if (fieldName === "bio") {
        setBio(res.user.bio || "Share a thought");
        setIsEditingBio(false);
      }
      if (fieldName === "avatar") {
        setAvatar(res.user.avatar || "");
        setIsEditingAvatar(false);
      }
      if (fieldName === "skills") {
        setSkills(res.user.skills?.join(", ") || "");
        setIsEditingSkills(false);
      }
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm("Are you sure you want to log out from all other devices?")) return;
    try {
      await logoutAllDevices();
      toast.success("Logged out from all devices");
      window.location.href = "/login";
    } catch (err) {
      toast.error("Failed to log out from all devices");
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        .slack-profile-modal {
          background: #121829;
          border: 1px solid #232d45;
          border-radius: 16px;
          padding: 24px;
          color: #e8eaf0;
          font-family: "Inter", sans-serif;
          position: relative;
          box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        }
        .slack-avatar-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          margin-bottom: 28px;
        }
        .slack-avatar-circle {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          background: #2d1822;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          font-weight: bold;
          color: #f472b6;
          border: 2px solid #232d45;
          overflow: hidden;
        }
        .slack-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .slack-avatar-edit-btn {
          margin-top: -16px;
          background: #1a2236;
          border: 1px solid #2a3654;
          border-radius: 20px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #22c55e;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px rgba(0,0,0,0.25);
          z-index: 10;
        }
        .slack-avatar-edit-btn:hover {
          background: #232d45;
          border-color: #22c55e;
        }
        .slack-section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 12px;
        }
        .slack-profile-section {
          margin-bottom: 24px;
        }
        .slack-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
        }
        .slack-row-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }
        .slack-status-icon {
          color: #22c55e;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .slack-text-value {
          font-size: 15px;
          font-weight: 600;
          color: #e8eaf0;
        }
        .slack-text-sub {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }
        .slack-edit-icon {
          color: #64748b;
          cursor: pointer;
          padding: 6px;
          border-radius: 50%;
          display: flex;
          transition: background 0.2s, color 0.2s;
        }
        .slack-edit-icon:hover {
          background: rgba(255,255,255,0.06);
          color: #e8eaf0;
        }
        .slack-input-edit {
          display: flex;
          gap: 8px;
          width: 100%;
        }
        .slack-input-edit input {
          flex: 1;
          background: #1a2236;
          border: 1px solid #2a3654;
          color: #e8eaf0;
          padding: 6px 12px;
          font-size: 14px;
          border-radius: 6px;
        }
        .slack-input-btn {
          padding: 6px 10px;
          background: #22c55e;
          border-radius: 6px;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
      `}</style>

      <div className="modal-content slack-profile-modal" style={{ maxWidth: 420, width: "100%" }}>
        {/* Close Button */}
        <button 
          onClick={onClose} 
          style={{ position: "absolute", top: 16, right: 16, color: "var(--color-text-muted)", cursor: "pointer" }}
        >
          <FiX size={20} />
        </button>

        {/* Avatar Container */}
        <div className="slack-avatar-container">
          <div className="slack-avatar-circle">
            {avatar ? (
              <img src={avatar} alt="Avatar" className="slack-avatar-img" />
            ) : (
              name.substring(0, 1).toUpperCase()
            )}
          </div>
          <button className="slack-avatar-edit-btn" onClick={() => setIsEditingAvatar(!isEditingAvatar)}>
            <FiCamera size={14} /> Edit
          </button>

          {/* Inline Avatar Edit Field */}
          {isEditingAvatar && (
            <div className="slack-input-edit" style={{ marginTop: 14, width: "90%" }}>
              <input
                type="text"
                placeholder="Paste avatar URL..."
                value={avatarInput}
                onChange={(e) => setAvatarInput(e.target.value)}
              />
              <button className="slack-input-btn" onClick={() => saveField("avatar", avatarInput)}>
                <FiCheck size={16} />
              </button>
            </div>
          )}
        </div>

        {/* About Section */}
        <div className="slack-profile-section">
          <div className="slack-section-title">About</div>
          {isEditingBio ? (
            <div className="slack-input-edit">
              <input
                type="text"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                maxLength={100}
              />
              <button className="slack-input-btn" onClick={() => saveField("bio", bioInput)}>
                <FiCheck size={16} />
              </button>
            </div>
          ) : (
            <div className="slack-row">
              <div className="slack-row-left">
                <span className="slack-status-icon">
                  <FiSmile size={18} />
                </span>
                <div>
                  <div className="slack-text-value">{bio}</div>
                  <div className="slack-text-sub">Until I change it</div>
                </div>
              </div>
              <button className="slack-edit-icon" onClick={() => { setBioInput(bio); setIsEditingBio(true); }}>
                <FiEdit2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Name Section */}
        <div className="slack-profile-section">
          <div className="slack-section-title">Name</div>
          {isEditingName ? (
            <div className="slack-input-edit">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                required
              />
              <button className="slack-input-btn" onClick={() => saveField("name", nameInput)}>
                <FiCheck size={16} />
              </button>
            </div>
          ) : (
            <div className="slack-row">
              <div className="slack-text-value" style={{ fontSize: 16 }}>{name}</div>
              <button className="slack-edit-icon" onClick={() => { setNameInput(name); setIsEditingName(true); }}>
                <FiEdit2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div className="slack-profile-section">
          <div className="slack-section-title">Skills</div>
          {isEditingSkills ? (
            <div className="slack-input-edit">
              <input
                type="text"
                placeholder="React, Node, etc."
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
              />
              <button className="slack-input-btn" onClick={() => saveField("skills", skillsInput)}>
                <FiCheck size={16} />
              </button>
            </div>
          ) : (
            <div className="slack-row">
              <div className="slack-text-value" style={{ fontWeight: "normal", color: "var(--color-text-secondary)" }}>
                {skills || "No skills added yet."}
              </div>
              <button className="slack-edit-icon" onClick={() => { setSkillsInput(skills); setIsEditingSkills(true); }}>
                <FiEdit2 size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Action Panel Footer */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #232d45", display: "flex", flexDirection: "column", gap: 10 }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleLogoutAll}
            style={{ width: "100%", color: "var(--color-danger)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 38 }}
          >
            <FiLogOut size={14} /> Log out from all other devices
          </button>
        </div>
      </div>
    </div>
  );
}
