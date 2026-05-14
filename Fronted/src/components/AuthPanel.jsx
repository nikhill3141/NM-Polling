import React from "react";
import { Send } from "lucide-react";

export default function AuthPanel({
  authMode,
  setAuthMode,
  authForm,
  setAuthForm,
  handleAuth,
  loading,
  message,
}) {
  return (
    <section className="auth-panel">
      <div className="segmented">
        <button className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")} type="button">
          Login
        </button>
        <button className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")} type="button">
          Signup
        </button>
      </div>

      <form onSubmit={handleAuth} className="stack">
        {authMode === "signup" && (
          <div className="two-col">
            <label>
              First name
              <input value={authForm.firstName} onChange={(event) => setAuthForm({ ...authForm, firstName: event.target.value })} required />
            </label>
            <label>
              Last name
              <input value={authForm.lastName} onChange={(event) => setAuthForm({ ...authForm, lastName: event.target.value })} />
            </label>
          </div>
        )}
        <label>
          Email
          <input type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} required />
        </label>
        <label>
          Password
          <input type="password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} required />
        </label>
        <button className="primary-btn" disabled={loading}>
          <Send size={18} />
          {authMode === "login" ? "Unlock dashboard" : "Create account"}
        </button>
        {message && <p className="status-text">{message}</p>}
      </form>
    </section>
  );
}
