import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form);
      navigate("/chat");
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">Discord Clone</div>
        <h1>Create account</h1>
        <p>Build your profile and join real-time group conversations.</p>
        {error ? <div className="error-box">{error}</div> : null}
        <label>Username</label>
        <input
          value={form.username}
          onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={form.password}
          onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          required
        />
        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Register"}
        </button>
        <span className="auth-switch-text">
          Already have account? <Link to="/login">Login</Link>
        </span>
      </form>
    </div>
  );
}
