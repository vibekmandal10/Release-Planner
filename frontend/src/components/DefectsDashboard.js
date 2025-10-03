import React, { useState, useEffect } from "react";
import "./DefectsDashboard.css";

const DefectsDashboard = ({ releases, accounts, regions }) => {
  const [filteredDefects, setFilteredDefects] = useState([]);
  const [filters, setFilters] = useState({
    account_name: "",
    release_version: "",
    severity: "",
    status: "",
  });
  const [defectStats, setDefectStats] = useState({});

  useEffect(() => {
    calculateDefectStats();
    applyFilters();
  }, [releases, filters]);

  const calculateDefectStats = () => {
    const completedReleases = releases.filter((r) => r.status === "Completed");
    const allDefects = completedReleases.flatMap((release) =>
      (release.defects || []).map((defect) => ({
        ...defect,
        account_name: release.account_name,
        release_version: release.release_version,
      }))
    );

    const stats = {
      totalDefects: allDefects.length,
      totalReleases: completedReleases.length,
      defectRate:
        completedReleases.length > 0
          ? (allDefects.length / completedReleases.length).toFixed(2)
          : 0,
      severityBreakdown: allDefects.reduce((acc, defect) => {
        acc[defect.severity] = (acc[defect.severity] || 0) + 1;
        return acc;
      }, {}),
      statusBreakdown: allDefects.reduce((acc, defect) => {
        acc[defect.status] = (acc[defect.status] || 0) + 1;
        return acc;
      }, {}),
      accountBreakdown: allDefects.reduce((acc, defect) => {
        acc[defect.account_name] = (acc[defect.account_name] || 0) + 1;
        return acc;
      }, {}),
    };

    setDefectStats(stats);
  };

  const applyFilters = () => {
    const completedReleases = releases.filter((r) => r.status === "Completed");
    let allDefects = completedReleases.flatMap((release) =>
      (release.defects || []).map((defect) => ({
        ...defect,
        account_name: release.account_name,
        release_version: release.release_version,
      }))
    );

    // Apply filters
    if (filters.account_name) {
      allDefects = allDefects.filter(
        (defect) => defect.account_name === filters.account_name
      );
    }
    if (filters.release_version) {
      allDefects = allDefects.filter(
        (defect) => defect.release_version === filters.release_version
      );
    }
    if (filters.severity) {
      allDefects = allDefects.filter(
        (defect) => defect.severity === filters.severity
      );
    }
    if (filters.status) {
      allDefects = allDefects.filter(
        (defect) => defect.status === filters.status
      );
    }

    setFilteredDefects(allDefects);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      account_name: "",
      release_version: "",
      severity: "",
      status: "",
    });
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case "Low":
        return "🟢";
      case "Medium":
        return "🟡";
      case "High":
        return "🟠";
      case "Critical":
        return "🔴";
      default:
        return "⚪";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Open":
        return "📂";
      case "In Progress":
        return "⚡";
      case "Fixed":
        return "✅";
      case "Closed":
        return "🔒";
      case "Rejected":
        return "❌";
      default:
        return "❓";
    }
  };

  const handleDefectIdClick = (defectId) => {
    // Open JIRA link in new tab
    const jiraBaseUrl = "https://deljira/browse/";
    window.open(`${jiraBaseUrl}${defectId}`, "_blank");
  };

  return (
    <div className="defects-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h2>🐛 Defects Analytics Dashboard</h2>
          <p>Comprehensive view of all defects across completed releases</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card defect">
          <h3>Total Defects</h3>
          <div className="stat-number">{defectStats.totalDefects || 0}</div>
          <div className="stat-label">Across All Releases</div>
        </div>

        <div className="stat-card in-progress">
          <h3>Defect Rate</h3>
          <div className="stat-number">{defectStats.defectRate || 0}</div>
          <div className="stat-label">Defects per Release</div>
        </div>

        <div className="stat-card scheduled">
          <h3>Open Defects</h3>
          <div className="stat-number">
            {defectStats.statusBreakdown?.Open || 0}
          </div>
          <div className="stat-label">Need Attention</div>
        </div>

        <div className="stat-card done">
          <h3>Fixed Defects</h3>
          <div className="stat-number">
            {defectStats.statusBreakdown?.Fixed || 0}
          </div>
          <div className="stat-label">Successfully Resolved</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <h3>🔍 Filter Defects</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>Account:</label>
            <select
              name="account_name"
              value={filters.account_name}
              onChange={handleFilterChange}
            >
              <option value="">All Accounts</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.name}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Release Version:</label>
            <select
              name="release_version"
              value={filters.release_version}
              onChange={handleFilterChange}
            >
              <option value="">All Versions</option>
              {regions.map((region) => (
                <option key={region.id} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Severity:</label>
            <select
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
            >
              <option value="">All Severities</option>
              <option value="Low">🟢 Low</option>
              <option value="Medium">🟡 Medium</option>
              <option value="High">🟠 High</option>
              <option value="Critical">🔴 Critical</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="Open">📂 Open</option>
              <option value="In Progress">⚡ In Progress</option>
              <option value="Fixed">✅ Fixed</option>
              <option value="Closed">🔒 Closed</option>
              <option value="Rejected">❌ Rejected</option>
            </select>
          </div>

          <div className="filter-actions">
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              🔄 Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      {(filters.account_name ||
        filters.release_version ||
        filters.severity ||
        filters.status) && (
        <div className="results-info">
          <p>
            Showing {filteredDefects.length} defect(s)
            {filters.account_name && ` for ${filters.account_name}`}
            {filters.release_version && ` in ${filters.release_version}`}
            {filters.severity && ` with ${filters.severity} severity`}
            {filters.status && ` with ${filters.status} status`}
          </p>
        </div>
      )}

      {/* Simplified Defects Table with Release Version */}
      <div className="table-container">
        {filteredDefects.length === 0 ? (
          <div className="empty-state">
            <p>
              {releases.filter((r) => r.status === "Completed").length === 0
                ? "No completed releases with defects found"
                : "No defects match the current filters"}
            </p>
          </div>
        ) : (
          <table className="releases-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Release Version</th>
                <th>Defect ID</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {filteredDefects.map((defect, index) => (
                <tr key={`${defect.account_name}-${defect.id}-${index}`}>
                  <td>
                    <span className="account-name">{defect.account_name}</span>
                  </td>
                  <td>
                    <span className="version-badge">
                      🏷️ {defect.release_version || "N/A"}
                    </span>
                  </td>
                  <td>
                    <span
                      className="defect-id-link"
                      onClick={() => handleDefectIdClick(defect.defect_id)}
                      title="Click to open in JIRA"
                    >
                      {defect.defect_id}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`severity-badge severity-${defect.severity.toLowerCase()}`}
                    >
                      {getSeverityIcon(defect.severity)} {defect.severity}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${defect.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      {getStatusIcon(defect.status)} {defect.status}
                    </span>
                  </td>
                  <td>
                    <div
                      className="defect-description"
                      title={defect.description}
                    >
                      {defect.description}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Severity and Status Breakdown */}
      <div className="breakdown-section">
        <div className="breakdown-card">
          <h4>📊 Severity Breakdown</h4>
          <div className="breakdown-stats">
            {Object.entries(defectStats.severityBreakdown || {}).map(
              ([severity, count]) => (
                <div key={severity} className="breakdown-item">
                  <span className="breakdown-label">
                    {getSeverityIcon(severity)} {severity}
                  </span>
                  <span className="breakdown-count">{count}</span>
                </div>
              )
            )}
          </div>
        </div>

        <div className="breakdown-card">
          <h4>🔄 Status Breakdown</h4>
          <div className="breakdown-stats">
            {Object.entries(defectStats.statusBreakdown || {}).map(
              ([status, count]) => (
                <div key={status} className="breakdown-item">
                  <span className="breakdown-label">
                    {getStatusIcon(status)} {status}
                  </span>
                  <span className="breakdown-count">{count}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefectsDashboard;
