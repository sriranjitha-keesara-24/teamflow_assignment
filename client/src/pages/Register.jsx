import { Link } from "react-router-dom";
import RegisterForm from "../components/auth/RegisterForm";
import "../styles/auth.css";

const Register = () => {
  return (
    <div className="auth-page" style={{ animation: "fadeIn 0.35s ease" }}>
      <div className="auth-brand-panel">
        <div className="auth-brand-logo">TeamFlow</div>
        <div className="auth-brand-content">
          <h1>Ship work with clarity, not chaos.</h1>
          <p>
            Plan projects, track tasks, run root cause analyses, and keep your
            whole team aligned — all in one place.
          </p>
        </div>
        <div className="auth-brand-footer">© {new Date().getFullYear()} TeamFlow</div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <h2>Create your account</h2>
          <p className="auth-subtitle">Get started with TeamFlow today</p>

          <RegisterForm />

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
