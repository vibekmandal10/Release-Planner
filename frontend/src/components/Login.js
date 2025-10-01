import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await login(credentials.username, credentials.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const demoCredentials = [
    {
      username: "admin",
      password: "admin123",
      role: "Administrator",
      description: "Full access to all features",
    },
    {
      username: "user",
      password: "user123",
      role: "Read Only User",
      description: "View releases only",
    },
    {
      username: "manager",
      password: "manager123",
      role: "Release Manager",
      description: "Full admin access",
    },
  ];

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Release Planner</h1>
          <p>Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary login-btn"
            disabled={loading}
          >
            {loading ? "🔄 Signing in..." : "🔐 Sign In"}
          </button>
        </form>

        {/* <div className="demo-credentials">
          <h3>🧪 Demo Credentials</h3>
          <div className="credentials-grid">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="credential-card">
                <div className="credential-header">
                  <strong>{cred.role}</strong>
                </div>
                <div className="credential-info">
                  <p><strong>Username:</strong> {cred.username}</p>
                  <p><strong>Password:</strong> {cred.password}</p>
                  <p className="credential-desc">{cred.description}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCredentials({ username: cred.username, password: cred.password })}
                  disabled={loading}
                >
                  📋 Use These Credentials
                </button>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Login;
