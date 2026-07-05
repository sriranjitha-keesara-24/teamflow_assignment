import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { registerUser } from "../../services/authService";
import { validateRegisterForm } from "../../utils/validators";

const RegisterForm = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validateRegisterForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      await registerUser(formData);
      toast.success("Account created! Check your email to verify.");
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="form-group">
        <label htmlFor="name">Full name</label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Jane Cooper"
          value={formData.name}
          onChange={handleChange}
        />
        {errors.name && <span className="field-error">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email address</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@company.com"
          value={formData.email}
          onChange={handleChange}
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={handleChange}
        />
        {errors.password && <span className="field-error">{errors.password}</span>}
      </div>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting && <span className="spinner" />}
        {submitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
};

export default RegisterForm;
