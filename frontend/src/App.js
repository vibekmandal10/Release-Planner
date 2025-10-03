import React, { useState, useEffect } from "react";
import "./App.css";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ReleaseTable from "./components/ReleaseTable";
import AdminPanel from "./components/AdminPanel";

function AppContent() {
  const { user, logout, isAdmin, isReadOnly } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [releases, setReleases] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [filteredReleases, setFilteredReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    setFilteredReleases(releases);
  }, [releases]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [releasesRes, accountsRes, regionsRes] = await Promise.all([
        fetch("/api/releases"),
        fetch("/api/accounts"),
        fetch("/api/regions"),
      ]);

      if (!releasesRes.ok || !accountsRes.ok || !regionsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const [releasesData, accountsData, regionsData] = await Promise.all([
        releasesRes.json(),
        accountsRes.json(),
        regionsRes.json(),
      ]);

      setReleases(releasesData);
      setAccounts(accountsData);
      setRegions(regionsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (filters) => {
    try {
      if (
        !filters.release_version &&
        !filters.account_region &&
        !filters.status
      ) {
        setFilteredReleases(releases);
        return;
      }

      let filtered = releases;

      if (filters.release_version) {
        filtered = filtered.filter(
          (release) => release.release_version === filters.release_version
        );
      }

      if (filters.account_region) {
        filtered = filtered.filter((release) => {
          const account = accounts.find(
            (acc) => acc.name === release.account_name
          );
          return account && account.region === filters.account_region;
        });
      }

      if (filters.status) {
        filtered = filtered.filter(
          (release) => release.status === filters.status
        );
      }

      setFilteredReleases(filtered);
    } catch (error) {
      console.error("Error filtering releases:", error);
      setFilteredReleases(releases);
    }
  };

  // Show login if no user
  if (!user) {
    return <Login />;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Release Planning System...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>⚠️ Error Loading Data</h2>
        <p>{error}</p>
        <button onClick={fetchData} className="btn btn-primary">
          🔄 Retry
        </button>
      </div>
    );
  }

  const getAvailableTabs = () => {
    const tabs = [{ id: "dashboard", label: "📊 Dashboard", icon: "📊" }];

    // All users can view releases
    tabs.push({ id: "releases", label: "📋 View Releases", icon: "📋" });

    // Only admins can access admin panel
    if (isAdmin()) {
      tabs.push({ id: "admin", label: "⚙️ Admin Panel", icon: "⚙️" });
    }

    return tabs;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            releases={releases}
            accounts={accounts}
            regions={regions}
          />
        );
      case "releases":
        return (
          <ReleaseTable
            releases={filteredReleases}
            regions={regions}
            accounts={accounts}
            onEdit={() => {}} // Read-only for non-admin users
            onDelete={() => {}} // Read-only for non-admin users
            onFilter={handleFilter}
            readOnly={isReadOnly()} // Pass read-only flag based on user role
          />
        );
      case "admin":
        // Only allow admin access
        if (!isAdmin()) {
          return (
            <div className="access-denied">
              <h2>🚫 Access Denied</h2>
              <p>You don't have permission to access the Admin Panel.</p>
            </div>
          );
        }
        return <AdminPanel onDataUpdate={fetchData} />;
      default:
        return (
          <Dashboard
            releases={releases}
            accounts={accounts}
            regions={regions}
          />
        );
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            {/* <h1>🚀 Release Planning System</h1> */}
            <nav className="nav-tabs">
              {getAvailableTabs().map((tab) => (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
              {/* <label>Release Version:</label>
              <select
                name="release_version"
                value={formData.release_version}
                onChange={handleChange}
                required
              >
                <option value="">Select Release Version</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.name}>
                    {region.name} - {region.description}
                  </option>
                ))}
              </select> */}
            </nav>
          </div>
          <div className="header-right">
            <div className="user-info">
              <span className="user-role">
                {isAdmin() ? "👑 Admin" : "👤 User"}: {user.name}
              </span>
              <button
                onClick={logout}
                className="btn btn-secondary btn-sm logout-btn"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
        {/* <nav className="nav-tabs">
          {getAvailableTabs().map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav> */}
      </header>

      <main className="main-content">{renderContent()}</main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
