import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
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
    const credentials = {
      username: form.username.trim().toLowerCase(),
      password: form.password,
    };

    try {
      await login(credentials);
      navigate("/chat");
    } catch (submitError) {
      const fallbackMessage =
        "Invalid credentials. Try username: khyathisree@gmail.com and password: pass1234";
      setError(submitError.message === "Invalid credentials" ? fallbackMessage : submitError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">Discord Clone</div>
        <h1>Welcome back</h1>
        <p>Login to continue to your community chats.</p>
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
          {loading ? "Logging in..." : "Login"}
        </button>
        <span className="auth-switch-text">
          New user? <Link to="/register">Create account</Link>
        </span>
      </form>
    </div>
  );
}
