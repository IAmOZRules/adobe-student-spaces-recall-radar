"use client";

import { useEffect, useState } from "react";

interface FunnelStage {
  label: string;
  count: number;
  pct: number;
}

interface Signup {
  id: number;
  email: string;
  completed_quiz: boolean;
  shared_link: boolean;
  created_at: string;
}

type AuthState = "checking" | "loggedOut" | "loggedIn";

export default function AdminPage() {
  const [auth, setAuth] = useState<AuthState>("checking");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [stages, setStages] = useState<FunnelStage[] | null>(null);
  const [signups, setSignups] = useState<Signup[] | null>(null);
  const [resetting, setResetting] = useState(false);
  const [loadError, setLoadError] = useState("");

  async function loadDashboard() {
    setLoadError("");
    try {
      const [funnelRes, signupsRes] = await Promise.all([fetch("/api/admin/funnel"), fetch("/api/admin/signups")]);
      if (funnelRes.status === 401 || signupsRes.status === 401) {
        setAuth("loggedOut");
        return;
      }
      if (!funnelRes.ok || !signupsRes.ok) throw new Error("load failed");
      const funnelJson = await funnelRes.json();
      const signupsJson = await signupsRes.json();
      setStages(funnelJson.stages);
      setSignups(signupsJson.signups);
      setAuth("loggedIn");
    } catch {
      setLoadError("Couldn't load admin data — try refreshing.");
    }
  }

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoginError(data.error ?? "Login failed");
        return;
      }
      setPassword("");
      await loadDashboard();
    } catch {
      setLoginError("Login failed — try again.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    setAuth("loggedOut");
    setStages(null);
    setSignups(null);
  }

  async function handleReset() {
    const confirmed = window.confirm(
      "This permanently clears all shared quiz data — funnel counts, every concept score, and interview signups. This can't be undone. Continue?"
    );
    if (!confirmed) return;
    setResetting(true);
    try {
      const res = await fetch("/api/admin/reset", { method: "POST" });
      if (res.status === 401) {
        setAuth("loggedOut");
        return;
      }
      if (!res.ok) throw new Error("reset failed");
      await loadDashboard();
    } catch {
      setLoadError("Reset failed — try again.");
    } finally {
      setResetting(false);
    }
  }

  if (auth === "checking") {
    return (
      <div className="admin-shell">
        <div className="loading-row">
          <div className="spinner" /> Checking admin session…
        </div>
      </div>
    );
  }

  if (auth === "loggedOut") {
    return (
      <div className="admin-shell">
        <div className="card">
          <div className="eyebrow">Admin</div>
          <h1 className="hero" style={{ fontSize: "24px" }}>
            Recall Radar admin
          </h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              className="interview-email-input"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", marginBottom: "12px" }}
              autoFocus
            />
            <button className="btn-primary" type="submit" disabled={loggingIn} style={{ width: "100%" }}>
              {loggingIn ? "Checking…" : "Log in"}
            </button>
            {loginError && <div className="form-error">{loginError}</div>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-shell" style={{ maxWidth: "640px" }}>
      <div className="card">
        <div className="topbar" style={{ marginBottom: "16px" }}>
          <div className="eyebrow" style={{ marginBottom: 0 }}>
            Admin
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="nav-link" onClick={loadDashboard}>
              Refresh
            </button>
            <button className="nav-link" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </div>

        {loadError && <div className="form-error">{loadError}</div>}

        <div className="section-label" style={{ marginTop: 0 }}>
          Engagement funnel
        </div>
        {stages?.map((s) => (
          <div className="funnel-row" key={s.label}>
            <span>{s.label}</span>
            <span>
              <b>{s.count}</b> <span style={{ color: "var(--ink-soft)" }}>({s.pct}% of Started)</span>
            </span>
          </div>
        ))}

        <div className="section-label">Interview signups</div>
        {signups && signups.length === 0 && <div className="empty-state">No signups yet.</div>}
        {signups && signups.length > 0 && (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Completed</th>
                <th>Shared</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {signups.map((s) => (
                <tr key={s.id}>
                  <td>{s.email}</td>
                  <td>{s.completed_quiz ? "Yes" : "No"}</td>
                  <td>{s.shared_link ? "Yes" : "No"}</td>
                  <td>{new Date(s.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="section-label">Danger zone</div>
        <button
          className="btn-ghost"
          onClick={handleReset}
          disabled={resetting}
          style={{ color: "var(--red-deep)", borderColor: "var(--red-tint-2)" }}
        >
          {resetting ? "Resetting…" : "Reset all stored data"}
        </button>
      </div>
    </div>
  );
}
