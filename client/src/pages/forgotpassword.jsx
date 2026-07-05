import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { forgotPassword } from "../services/authService";
import { isValidEmail } from "../utils/validators";
import "../styles/auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Enter a valid email address");
      return;
    }

    setSubmitting(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      const message = err.response?.data?.message || "Something went wrong.";
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
          <h1>Forgot your password?</h1>
          <p>No worries — we'll send you a reset link to get back in.</p>
        </div>
        <div className="auth-brand-footer">© {new Date().getFullYear()} TeamFlow</div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          {sent ? (
            <>
              <h2>Check your email</h2>
              <p className="auth-subtitle">
                If an account exists for <strong>{email}</strong>, a password
                reset link has been sent. The link expires in 1 hour.
              </p>
              <p className="auth-switch">
                <Link to="/login">Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h2>Reset your password</h2>
              <p className="auth-subtitle">
                Enter the email address associated with your account
              </p>
              <form className="auth-form" onSubmit={handleSubmit} noValidate>
                <div className="form-group">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                  />
                  {error && <span className="field-error">{error}</span>}
                </div>

                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting && <span className="spinner" />}
                  {submitting ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <p className="auth-switch">
                Remembered your password? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;