import { useCallback, useEffect, useMemo, useState } from "react";

const API = (import.meta.env.VITE_API_URL || "/api").replace(/\/+$/, "");

const MODULES = {
  disasters: {
    title: "Disasters",
    singular: "Disaster",
    description: "Monitor disaster events, severity, locations and status.",
    icon: "◈",
    fields: [
      { key: "disasterName", label: "Disaster name", required: true },
      {
        key: "disasterType",
        label: "Disaster type",
        required: true,
        options: [
          "Flood",
          "Earthquake",
          "Cyclone",
          "Fire",
          "Landslide",
          "Drought",
          "Other",
        ],
      },
      { key: "location", label: "Location" },
      {
        key: "severity",
        label: "Severity",
        options: ["Low", "Medium", "High", "Critical"],
      },
      { key: "startDate", label: "Start date", type: "date" },
      {
        key: "status",
        label: "Status",
        options: ["Active", "Ongoing", "Resolved", "Closed"],
      },
    ],
    columns: [
      { key: "disasterName", label: "Disaster" },
      { key: "disasterType", label: "Type" },
      { key: "location", label: "Location" },
      { key: "severity", label: "Severity" },
      { key: "startDate", label: "Start date" },
      { key: "status", label: "Status" },
    ],
  },

  incidents: {
    title: "Incidents",
    singular: "Incident",
    description: "Record, investigate and track reported incidents.",
    icon: "◎",
    fields: [
      { key: "disasterId", label: "Disaster ID", type: "number" },
      { key: "description", label: "Description", required: true },
      { key: "location", label: "Location", required: true },
      { key: "reportedBy", label: "Reported by (user ID)", type: "number" },
      {
        key: "incidentStatus",
        label: "Incident status",
        options: ["Open", "Reported", "In Progress", "Resolved", "Closed"],
      },
      { key: "reportedDate", label: "Reported date", type: "date" },
    ],
    columns: [
      { key: "id", label: "ID" },
      { key: "disasterName", label: "Disaster" },
      { key: "description", label: "Description" },
      { key: "location", label: "Location" },
      { key: "incidentStatus", label: "Status" },
      { key: "reportedDate", label: "Reported" },
    ],
  },

  resources: {
    title: "Resources",
    singular: "Resource",
    description: "Manage relief supplies, quantities and availability.",
    icon: "▤",
    fields: [
      { key: "disasterId", label: "Disaster ID", type: "number" },
      { key: "resourceName", label: "Resource name", required: true },
      {
        key: "resourceType",
        label: "Resource type",
        options: [
          "Food",
          "Water",
          "Medical",
          "Shelter",
          "Equipment",
          "Transport",
          "Other",
        ],
      },
      { key: "quantity", label: "Quantity", type: "number", required: true },
      { key: "location", label: "Location" },
      {
        key: "status",
        label: "Status",
        options: ["Available", "In Stock", "Allocated", "Unavailable"],
      },
    ],
    columns: [
      { key: "resourceName", label: "Resource" },
      { key: "resourceType", label: "Type" },
      { key: "quantity", label: "Quantity" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" },
    ],
  },

  volunteers: {
    title: "Volunteers",
    singular: "Volunteer",
    description: "Maintain volunteer profiles, skills and availability.",
    icon: "♙",
    fields: [
      { key: "name", label: "Full name", required: true },
      { key: "phone", label: "Phone number" },
      { key: "skill", label: "Skills" },
      { key: "location", label: "Location" },
      {
        key: "availability",
        label: "Availability",
        options: ["Available", "Unavailable", "On Duty", "Inactive"],
      },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "skill", label: "Skills" },
      { key: "location", label: "Location" },
      { key: "availability", label: "Availability" },
    ],
  },

  "relief-requests": {
    title: "Relief requests",
    singular: "Relief request",
    description: "Track requests for supplies and emergency assistance.",
    icon: "↗",
    fields: [
      { key: "disasterId", label: "Disaster ID", type: "number" },
      { key: "requestedBy", label: "Requested by (user ID)", type: "number" },
      {
        key: "requestType",
        label: "Request type",
        required: true,
        options: [
          "Food",
          "Water",
          "Medical",
          "Shelter",
          "Rescue",
          "Transport",
          "Other",
        ],
      },
      { key: "description", label: "Description", required: true },
      { key: "location", label: "Location", required: true },
      {
        key: "priority",
        label: "Priority",
        options: ["Low", "Medium", "High", "Critical"],
      },
      {
        key: "status",
        label: "Status",
        options: ["Pending", "Open", "In Progress", "Fulfilled", "Rejected"],
      },
      { key: "requestDate", label: "Request date", type: "date" },
    ],
    columns: [
      { key: "id", label: "ID" },
      { key: "disasterName", label: "Disaster" },
      { key: "requestType", label: "Type" },
      { key: "location", label: "Location" },
      { key: "priority", label: "Priority" },
      { key: "status", label: "Status" },
      { key: "requestDate", label: "Date" },
    ],
  },
};

const EMPTY_STATS = {
  disasters: { total: 0, active: 0 },
  incidents: { total: 0, open: 0 },
  resources: { total: 0, quantity: 0, available: 0 },
  volunteers: { total: 0, available: 0 },
  reliefRequests: { total: 0, pending: 0 },
};

async function apiRequest(path, options = {}) {
  let response;

  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw new Error(
      "Cannot reach the API server. Start the backend with: npm run server",
    );
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : {};

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`,
    );
  }

  return data;
}

function emptyForm(fields) {
  return Object.fromEntries(fields.map((field) => [field.key, ""]));
}

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

function statusClass(value) {
  const text = String(value || "")
    .toLowerCase()
    .trim();

  if (
    [
      "active",
      "available",
      "in stock",
      "ready",
      "resolved",
      "fulfilled",
      "closed",
      "low",
      "yes",
    ].includes(text)
  ) {
    return "status status-good";
  }

  if (
    [
      "critical",
      "high",
      "open",
      "pending",
      "reported",
      "requested",
      "unavailable",
      "rejected",
    ].includes(text)
  ) {
    return "status status-alert";
  }

  if (
    [
      "medium",
      "in progress",
      "ongoing",
      "on duty",
      "allocated",
      "under review",
    ].includes(text)
  ) {
    return "status status-progress";
  }

  return "status";
}

const CONNECTION_STATES = {
  checking: {
    dotClass: "dot-checking",
    title: "Checking connection",
    subtitle: "Contacting the local API",
  },
  oracle: {
    dotClass: "",
    title: "Oracle connected",
    subtitle: "Live database records",
  },
  demo: {
    dotClass: "dot-demo",
    title: "Demo mode",
    subtitle: "In-memory data · Oracle offline",
  },
  offline: {
    dotClass: "dot-offline",
    title: "API offline",
    subtitle: "Start with: npm run server",
  },
};

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("disasterUser") || "null");
    } catch {
      return null;
    }
  });

  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const response = await fetch(`${API}/health`, {
          headers: { Accept: "application/json" },
        });
        const data = response.ok ? await response.json() : {};

        if (!cancelled) {
          setApiStatus(data.demo ? "demo" : "oracle");
        }
      } catch {
        if (!cancelled) {
          setApiStatus("offline");
        }
      }
    }

    checkHealth();
    const timer = window.setInterval(checkHealth, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    const pageTitle = MODULES[activePage]?.title;

    document.title =
      !user || activePage === "dashboard" || !pageTitle
        ? "DisasterOS | Disaster Management System"
        : `DisasterOS | ${pageTitle}`;
  }, [activePage, user]);

  const notify = useCallback((message, type = "success") => {
    setNotice({ message, type });
    window.setTimeout(() => setNotice(null), 3500);
  }, []);

  const logout = () => {
    localStorage.removeItem("disasterUser");
    setUser(null);
    setActivePage("dashboard");
  };

  if (!user) {
    return <Login onLogin={setUser} apiStatus={apiStatus} />;
  }

  const page = MODULES[activePage];
  const connection = CONNECTION_STATES[apiStatus] || CONNECTION_STATES.checking;

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="mobile-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">D</div>
          <div>
            <div className="brand-name">
              Disaster<span>OS</span>
            </div>
            <div className="brand-subtitle">RESPONSE MANAGEMENT</div>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <div className="nav-caption">WORKSPACE</div>
        <nav className="navigation">
          <button
            className={`nav-item ${activePage === "dashboard" ? "nav-active" : ""}`}
            onClick={() => {
              setActivePage("dashboard");
              setSidebarOpen(false);
            }}
          >
            <span className="nav-icon">▦</span>
            <span>Overview</span>
          </button>

          {Object.entries(MODULES).map(([key, module]) => (
            <button
              key={key}
              className={`nav-item ${activePage === key ? "nav-active" : ""}`}
              onClick={() => {
                setActivePage(key);
                setSidebarOpen(false);
              }}
            >
              <span className="nav-icon">{module.icon}</span>
              <span>{module.title}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="system-indicator">
            <span className={`online-dot ${connection.dotClass}`} />
            <div>
              <strong>{connection.title}</strong>
              <small>{connection.subtitle}</small>
            </div>
          </div>
          <div className="profile">
            <div className="avatar">
              {(user.name || user.username || "U").charAt(0).toUpperCase()}
            </div>
            <div className="profile-info">
              <strong>{user.name || user.username}</strong>
              <small>{user.role || "USER"}</small>
            </div>
            <button className="logout-button" onClick={logout} title="Log out">
              ↗
            </button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-separator">/</span>
              <strong>{page?.title || "Overview"}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <span className="live-indicator">
              <span /> Live workspace
            </span>
            <div className="topbar-avatar">
              {(user.name || user.username || "U").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {notice && (
          <div className={`toast toast-${notice.type}`} role="status">
            <span>{notice.type === "success" ? "✓" : "!"}</span>
            {notice.message}
            <button onClick={() => setNotice(null)} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}

        <div className="page-content">
          {activePage === "dashboard" ? (
            <Dashboard onNavigate={setActivePage} />
          ) : (
            <ModulePage
              key={activePage}
              moduleKey={activePage}
              module={page}
              notify={notify}
              apiStatus={apiStatus}
            />
          )}
        </div>

        <footer className="footer">
          <span>DisasterOS · Disaster Management System</span>
          <span>
            {apiStatus === "demo"
              ? "Demo data · in-memory store"
              : apiStatus === "oracle"
                ? "Oracle Database · local environment"
                : "Connect the backend to load data"}
          </span>
        </footer>
      </main>
    </div>
  );
}

function Login({ onLogin, apiStatus }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      localStorage.setItem("disasterUser", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (err) {
      setError(
        err.message || "Login failed. Check the server and credentials.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <section className="login-panel">
        <div className="login-brand">
          <div className="brand-mark brand-mark-large">D</div>
          <div>
            <div className="brand-name">
              Disaster<span>OS</span>
            </div>
            <div className="brand-subtitle">RESPONSE MANAGEMENT</div>
          </div>
        </div>

        <div className="login-heading">
          <span className="eyebrow">COMMAND CENTER ACCESS</span>
          <h1>Welcome back.</h1>
          <p>Sign in to coordinate disaster response and relief operations.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            autoComplete="username"
            autoFocus
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter your username"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            required
          />

          {error && <div className="form-error">{error}</div>}

          <button className="primary-button login-submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in to workspace"} <span>→</span>
          </button>
        </form>

        <div className="demo-hint">
          <span className="demo-badge">DEMO</span>
          <span>
            {apiStatus === "demo"
              ? "Oracle is offline. Use "
              : "Try the demo store with "}
            <strong>admin</strong> / <strong>admin123</strong>
            {apiStatus !== "demo" && (
              <>, or sign in with your Oracle USERS account</>
            )}
          </span>
        </div>

        <div className="login-footnote">
          <span
            className={`online-dot ${
              apiStatus === "offline"
                ? "dot-offline"
                : apiStatus === "demo"
                  ? "dot-demo"
                  : ""
            }`}
          />
          {apiStatus === "offline"
            ? "API server offline · run npm run server in the project folder"
            : apiStatus === "demo"
              ? "Demo workspace · in-memory data, not Oracle"
              : "Secure local workspace · Oracle-backed data"}
        </div>
      </section>

      <aside className="login-aside">
        <div className="aside-grid" />
        <div className="aside-content">
          <span className="eyebrow">COORDINATED RESPONSE</span>
          <h2>Every response starts with better information.</h2>
          <p>
            A central workspace for disaster events, incident reporting,
            resource allocation, volunteers and relief requests.
          </p>
          <div className="aside-rule" />
          <div className="aside-stat-row">
            <div>
              <strong>01</strong>
              <span>Situational awareness</span>
            </div>
            <div>
              <strong>02</strong>
              <span>Resource coordination</span>
            </div>
            <div>
              <strong>03</strong>
              <span>Response tracking</span>
            </div>
          </div>
        </div>
        <div className="aside-footer">
          DISASTER RESPONSE · OPERATIONS PLATFORM
        </div>
      </aside>
    </div>
  );
}

function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(EMPTY_STATS);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const [statsData, incidentData] = await Promise.all([
          apiRequest("/dashboard/stats"),
          apiRequest("/dashboard/recent-incidents"),
        ]);

        if (cancelled) return;

        setStats({
          ...EMPTY_STATS,
          ...statsData,
        });
        setIncidents(Array.isArray(incidentData) ? incidentData : []);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const refresh = useCallback(() => {
    setLoading(true);
    setError("");
    setReloadKey((key) => key + 1);
  }, []);

  const cards = [
    {
      label: "Total disasters",
      value: stats.disasters.total,
      detail: `${formatNumber(stats.disasters.active)} active`,
      icon: "◈",
      tone: "tone-red",
      destination: "disasters",
    },
    {
      label: "Reported incidents",
      value: stats.incidents.total,
      detail: `${formatNumber(stats.incidents.open)} open or pending`,
      icon: "◎",
      tone: "tone-orange",
      destination: "incidents",
    },
    {
      label: "Resource records",
      value: stats.resources.total,
      detail: `${formatNumber(stats.resources.quantity)} total units`,
      icon: "▤",
      tone: "tone-blue",
      destination: "resources",
    },
    {
      label: "Volunteers",
      value: stats.volunteers.total,
      detail: `${formatNumber(stats.volunteers.available)} available`,
      icon: "♙",
      tone: "tone-green",
      destination: "volunteers",
    },
    {
      label: "Relief requests",
      value: stats.reliefRequests.total,
      detail: `${formatNumber(stats.reliefRequests.pending)} pending`,
      icon: "↗",
      tone: "tone-purple",
      destination: "relief-requests",
    },
  ];

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="dashboard">
      <div className="page-heading dashboard-heading">
        <div>
          <span className="eyebrow">OPERATIONS OVERVIEW</span>
          <h1>
            Command center<span className="heading-period">.</span>
          </h1>
          <p>
            Monitor events, coordinate resources and track response activity.
          </p>
        </div>
        <div className="heading-actions">
          <div className="date-chip">
            <span>◷</span> {today}
          </div>
          <button className="secondary-button" onClick={refresh}>
            <span>↻</span> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Dashboard could not fully load.</strong>
          <span>{error}</span>
          <button className="text-button" onClick={refresh}>
            Try again
          </button>
        </div>
      )}

      <div className="section-heading">
        <div>
          <h2>Situation summary</h2>
          <p>Current records from your Oracle database</p>
        </div>
        <span className="data-label">
          <span className="online-dot" /> LIVE DATA
        </span>
      </div>

      <div className="metrics-grid">
        {cards.map((card) => (
          <button
            className="metric-card"
            key={card.label}
            onClick={() => onNavigate(card.destination)}
          >
            <div className="metric-top">
              <span className="metric-label">{card.label}</span>
              <span className={`metric-icon ${card.tone}`}>{card.icon}</span>
            </div>
            <div className="metric-value">
              {loading ? (
                <span className="loading-dash">—</span>
              ) : (
                formatNumber(card.value)
              )}
            </div>
            <div className="metric-detail">{card.detail}</div>
            <span className="metric-arrow">↗</span>
          </button>
        ))}
      </div>

      <div className="dashboard-lower">
        <section className="panel incidents-panel">
          <div className="panel-heading">
            <div>
              <h2>Recent incidents</h2>
              <p>Latest incident reports in the system</p>
            </div>
            <button
              className="text-button"
              onClick={() => onNavigate("incidents")}
            >
              View all <span>→</span>
            </button>
          </div>

          {loading ? (
            <div className="empty-state">
              <div className="empty-symbol">◌</div>
              <strong>Loading incidents</strong>
              <p>Retrieving the latest records...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-symbol">◎</div>
              <strong>No incidents recorded yet</strong>
              <p>New incident reports will appear here.</p>
              <button
                className="secondary-button"
                onClick={() => onNavigate("incidents")}
              >
                Open incidents
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="data-table dashboard-table">
                <thead>
                  <tr>
                    <th>Incident</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Reported</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => (
                    <tr key={incident.id}>
                      <td>
                        <div className="table-primary">
                          {displayValue(incident.description)}
                        </div>
                        <div className="table-secondary">
                          {displayValue(incident.disasterName)}
                        </div>
                      </td>
                      <td>{displayValue(incident.location)}</td>
                      <td>
                        <span className={statusClass(incident.incidentStatus)}>
                          {displayValue(incident.incidentStatus)}
                        </span>
                      </td>
                      <td>{displayValue(incident.reportedDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel shortcuts-panel">
          <div className="panel-heading">
            <div>
              <h2>Quick actions</h2>
              <p>Jump into a response workflow</p>
            </div>
          </div>

          <div className="quick-actions">
            {[
              ["disasters", "◈", "Register disaster", "Create an event record"],
              ["incidents", "◎", "Report incident", "Log an incident"],
              ["resources", "▤", "Manage resources", "Update supplies"],
              [
                "relief-requests",
                "↗",
                "Review relief requests",
                "Track assistance",
              ],
            ].map(([key, icon, title, description]) => (
              <button
                key={key}
                className="quick-action"
                onClick={() => onNavigate(key)}
              >
                <span className="quick-icon">{icon}</span>
                <span className="quick-copy">
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <span className="quick-arrow">→</span>
              </button>
            ))}
          </div>

          <div className="coordination-note">
            <span className="note-icon">i</span>
            <div>
              <strong>Coordination note</strong>
              <p>
                Keep incident statuses and resource availability updated to
                maintain a useful operational overview.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function ModulePage({ moduleKey, module, notify, apiStatus }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => emptyForm(module.fields));
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        const data = await apiRequest(`/${moduleKey}`);

        if (!cancelled) {
          setRecords(Array.isArray(data) ? data : []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Could not load records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRecords();

    return () => {
      cancelled = true;
    };
  }, [moduleKey, reloadKey]);

  const refresh = useCallback(
    (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError("");
      setReloadKey((key) => key + 1);
    },
    [],
  );

  useEffect(() => {
    if (!showForm) return undefined;

    function handleKeyDown(event) {
      if (event.key === "Escape" && !saving) {
        setShowForm(false);
        setEditing(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [showForm, saving]);

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;

    return records.filter((record) =>
      Object.values(record).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [records, search]);

  function startCreate() {
    setEditing(null);
    setForm(emptyForm(module.fields));
    setShowForm(true);
  }

  function startEdit(record) {
    setEditing(record);
    setForm(
      Object.fromEntries(
        module.fields.map((field) => [
          field.key,
          record[field.key] === null || record[field.key] === undefined
            ? ""
            : String(record[field.key]),
        ]),
      ),
    );
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm(module.fields));
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const path = editing ? `/${moduleKey}/${editing.id}` : `/${moduleKey}`;

      await apiRequest(path, {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify(form),
      });

      notify(
        `${module.singular} ${editing ? "updated" : "created"} successfully.`,
      );
      closeForm();
      refresh(true);
    } catch (err) {
      setError(err.message || "Could not save this record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record) {
    const label = record[module.fields[0]?.key] || `ID ${record.id}`;
    if (!window.confirm(`Delete "${label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await apiRequest(`/${moduleKey}/${record.id}`, {
        method: "DELETE",
      });
      notify(`${module.singular} deleted successfully.`);
      refresh(true);
    } catch (err) {
      notify(err.message || "Could not delete this record.", "error");
    }
  }

  return (
    <div className="module-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RECORD MANAGEMENT</span>
          <h1>
            {module.title}
            <span className="heading-period">.</span>
          </h1>
          <p>{module.description}</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={() => refresh()}>
            <span>↻</span> Refresh
          </button>
          <button className="primary-button" onClick={startCreate}>
            <span>＋</span> Add {module.singular}
          </button>
        </div>
      </div>

      <div className="module-summary">
        <div className="summary-icon">{module.icon}</div>
        <div className="summary-copy">
          <strong>{formatNumber(records.length)} records</strong>
          <span>
            {apiStatus === "demo"
              ? "In-memory demo data (Oracle offline)"
              : "Stored in the Oracle database"}
          </span>
        </div>
        <div className="summary-divider" />
        <div className="summary-copy">
          <strong>{formatNumber(filteredRecords.length)} shown</strong>
          <span>
            {search ? "Matching your search" : "All available records"}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <strong>Something went wrong.</strong>
          <span>{error}</span>
          <button className="text-button" onClick={() => refresh()}>
            Retry
          </button>
        </div>
      )}

      <section className="panel records-panel">
        <div className="panel-heading records-toolbar">
          <div>
            <h2>All {module.title.toLowerCase()}</h2>
            <p>Search, edit or remove existing records.</p>
          </div>
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Search ${module.title.toLowerCase()}...`}
              aria-label={`Search ${module.title}`}
            />
            {search && (
              <button onClick={() => setSearch("")} aria-label="Clear search">
                ×
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-symbol">◌</div>
            <strong>Loading records</strong>
            <p>Connecting to the database...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="empty-state">
            <div className="empty-symbol">{module.icon}</div>
            <strong>
              {search
                ? "No matching records"
                : `No ${module.title.toLowerCase()} yet`}
            </strong>
            <p>
              {search
                ? "Try a different search term."
                : `Add your first ${module.singular.toLowerCase()} to get started.`}
            </p>
            {!search && (
              <button className="primary-button" onClick={startCreate}>
                ＋ Add {module.singular}
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  {module.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th className="actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    {module.columns.map((column) => {
                      const value = record[column.key];

                      return (
                        <td key={column.key}>
                          {column.key.toLowerCase().includes("status") ||
                          column.key === "severity" ||
                          column.key === "priority" ||
                          column.key === "availability" ? (
                            <span className={statusClass(value)}>
                              {displayValue(value)}
                            </span>
                          ) : (
                            <span
                              className={
                                column.key === "description"
                                  ? "description-cell"
                                  : ""
                              }
                              title={value ? String(value) : ""}
                            >
                              {displayValue(value)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <div className="row-actions">
                        <button
                          className="row-action edit-action"
                          onClick={() => startEdit(record)}
                          title="Edit record"
                          aria-label={`Edit record ${record.id}`}
                        >
                          ✎
                        </button>
                        <button
                          className="row-action delete-action"
                          onClick={() => handleDelete(record)}
                          title="Delete record"
                          aria-label={`Delete record ${record.id}`}
                        >
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span>
            Showing {filteredRecords.length} of {records.length} records
          </span>
          <span>
            {apiStatus === "demo" ? "Demo" : "Oracle"} · {module.title}
          </span>
        </div>
      </section>

      {showForm && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) closeForm();
          }}
        >
          <section className="form-modal" role="dialog" aria-modal="true">
            <div className="modal-heading">
              <div>
                <span className="eyebrow">
                  {editing ? "UPDATE RECORD" : "NEW RECORD"}
                </span>
                <h2>
                  {editing ? "Edit" : "Add"} {module.singular.toLowerCase()}
                </h2>
                <p>Enter the details below. Changes are saved to Oracle.</p>
              </div>
              <button
                className="icon-button modal-close"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                {module.fields.map((field, index) => (
                  <div
                    className={`field-group ${field.key === "description" ? "field-full" : ""}`}
                    key={field.key}
                  >
                    <label htmlFor={`field-${field.key}`}>
                      {field.label}
                      {field.required && (
                        <span className="required-mark"> *</span>
                      )}
                    </label>

                    {field.options ? (
                      <select
                        id={`field-${field.key}`}
                        autoFocus={index === 0}
                        value={form[field.key]}
                        onChange={(event) =>
                          updateField(field.key, event.target.value)
                        }
                        required={field.required}
                      >
                        <option value="">
                          Select {field.label.toLowerCase()}
                        </option>
                        {field.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : field.key === "description" ? (
                      <textarea
                        id={`field-${field.key}`}
                        autoFocus={index === 0}
                        value={form[field.key]}
                        onChange={(event) =>
                          updateField(field.key, event.target.value)
                        }
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        rows={3}
                        required={field.required}
                      />
                    ) : (
                      <input
                        id={`field-${field.key}`}
                        autoFocus={index === 0}
                        type={field.type || "text"}
                        min={field.type === "number" ? 0 : undefined}
                        value={form[field.key]}
                        onChange={(event) =>
                          updateField(field.key, event.target.value)
                        }
                        placeholder={
                          field.type === "date"
                            ? undefined
                            : `Enter ${field.label.toLowerCase()}`
                        }
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="form-hint">
                Fields marked <span className="required-mark">*</span> are
                required. Leave optional numeric IDs blank if they do not apply.
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save changes"
                      : `Create ${module.singular.toLowerCase()}`}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
