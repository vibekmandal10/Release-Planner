import React, { useState, useEffect } from "react";
import AccountManager from "./AccountManager";
import RegionManager from "./RegionManager";
import ReleaseManager from "./ReleaseManager";

const AdminPanel = ({ onDataUpdate }) => {
  const [activeSection, setActiveSection] = useState("releases");
  const [accounts, setAccounts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [releases, setReleases] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, regionsRes, releasesRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/regions"),
        fetch("/api/releases"),
      ]);

      const [accountsData, regionsData, releasesData] = await Promise.all([
        accountsRes.json(),
        regionsRes.json(),
        releasesRes.json(),
      ]);

      setAccounts(accountsData);
      setRegions(regionsData);
      setReleases(releasesData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleDataUpdate = async () => {
    await fetchData();
    if (onDataUpdate) {
      await onDataUpdate();
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case "releases":
        return (
          <ReleaseManager
            releases={releases}
            accounts={accounts}
            regions={regions}
            onDataUpdate={handleDataUpdate}
          />
        );
      case "accounts":
        return (
          <AccountManager accounts={accounts} onDataUpdate={handleDataUpdate} />
        );
      case "versions":
        return (
          <RegionManager regions={regions} onDataUpdate={handleDataUpdate} />
        );
      default:
        return (
          <ReleaseManager
            releases={releases}
            accounts={accounts}
            regions={regions}
            onDataUpdate={handleDataUpdate}
          />
        );
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h2>⚙️ Administration Panel</h2>
        <p>Manage releases, accounts, and system configuration</p>
      </div>

      <nav className="admin-nav">
        <button
          className={activeSection === "releases" ? "active" : ""}
          onClick={() => setActiveSection("releases")}
        >
          📅 Manage Releases
        </button>
        <button
          className={activeSection === "accounts" ? "active" : ""}
          onClick={() => setActiveSection("accounts")}
        >
          🏢 Accounts & Regions
        </button>
        <button
          className={activeSection === "versions" ? "active" : ""}
          onClick={() => setActiveSection("versions")}
        >
          🏷️ Release Versions
        </button>
      </nav>

      <div className="admin-content">{renderSection()}</div>
    </div>
  );
};

export default AdminPanel;
