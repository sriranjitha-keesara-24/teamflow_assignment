import { Link } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import "../styles/auth.css";

const Login = () => {
  return (
    <div className="auth-page">
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
          <h2>Welcome back</h2>
          <p className="auth-subtitle">Sign in to continue to your workspace</p>
          <LoginForm />
          <p className="auth-switch">
            Don't have an account? <Link to="/register">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
