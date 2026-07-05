import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { resetPassword } from "../services/authService";
import "../styles/auth.css";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ password: "", confirmPassword: "" });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationErrors = {};
        if (!formData.password || formData.password.length < 6) {
            validationErrors.password = "Password must be at least 6 characters";
        }
        if (formData.password !== formData.confirmPassword) {
            validationErrors.confirmPassword = "Passwords do not match";
        }
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setSubmitting(true);
        try {
            await resetPassword(token, formData.password);
            toast.success("Password reset successful. Please sign in.");
            navigate("/login");
        } catch (err) {
            const message =
                err.response?.data?.message || "Reset link is invalid or has expired.";
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-brand-panel">
                <div className="auth-brand-logo">TeamFlow</div>
                <div className="auth-brand-content">
                    <h1>Set a new password</h1>
                    <p>Choose a strong password you haven't used before.</p>
                </div>
                <div className="auth-brand-footer">© {new Date().getFullYear()} TeamFlow</div>
            </div>

            <div className="auth-form-panel">
                <div className="auth-card">
                    <h2>Create new password</h2>
                    <p className="auth-subtitle">Must be at least 6 characters</p>

                    <form className="auth-form" onSubmit={handleSubmit} noValidate>
                        <div className="form-group">
                            <label htmlFor="password">New password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            {errors.password && (
                                <span className="field-error">{errors.password}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm password</label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                            {errors.confirmPassword && (
                                <span className="field-error">{errors.confirmPassword}</span>
                            )}
                        </div>

                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting && <span className="spinner" />}
                            {submitting ? "Resetting..." : "Reset password"}
                        </button>
                    </form>

                    <p className="auth-switch">
                        <Link to="/login">Back to sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;