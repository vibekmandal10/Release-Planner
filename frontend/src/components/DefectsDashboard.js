import React, { useState, useEffect, useMemo } from "react";
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
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Add sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Get sorted release versions (latest first)
  const sortedReleaseVersions = useMemo(() => {
    return regions
      .map((region) => region.name)
      .sort((a, b) => {
        const getVersionNumber = (version) => {
          const match = version.match(/R(\d+)\.(\d+)/);
          if (match) {
            return parseFloat(`${match[1]}.${match[2]}`);
          }
          return 0;
        };

        const aNum = getVersionNumber(a);
        const bNum = getVersionNumber(b);

        return bNum - aNum; // Descending order (latest first)
      });
  }, [regions]);

  // Set default release version to latest on initial load
  useEffect(() => {
    if (isInitialLoad && sortedReleaseVersions.length > 0) {
      const latestVersion = sortedReleaseVersions[0];
      setFilters((prev) => ({
        ...prev,
        release_version: latestVersion,
      }));
      setIsInitialLoad(false);
    }
  }, [sortedReleaseVersions, isInitialLoad]);

  useEffect(() => {
    calculateDefectStats();
    applyFilters();
  }, [releases, filters]);

  const calculateDefectStats = () => {
    const completedReleases = releases.filter((r) => r.status === "Completed");

    // Filter by selected release version if specified
    const releasesToAnalyze = filters.release_version
      ? completedReleases.filter(
          (r) => r.release_version === filters.release_version
        )
      : completedReleases;

    const allDefects = releasesToAnalyze.flatMap((release) =>
      (release.defects || []).map((defect) => ({
        ...defect,
        account_name: release.account_name,
        release_version: release.release_version,
      }))
    );

    const stats = {
      totalDefects: allDefects.length,
      totalReleases: releasesToAnalyze.length,
      defectRate:
        releasesToAnalyze.length > 0
          ? (allDefects.length / releasesToAnalyze.length).toFixed(2)
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

  // Sorting function
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Sort defects based on current sort configuration
  const sortedDefects = useMemo(() => {
    if (!sortConfig.key) return filteredDefects;

    return [...filteredDefects].sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case "account_name":
          aValue = a.account_name || "";
          bValue = b.account_name || "";
          break;
        case "release_version":
          aValue = a.release_version || "";
          bValue = b.release_version || "";
          break;
        case "defect_id":
          aValue = a.defect_id || "";
          bValue = b.defect_id || "";
          break;
        case "severity":
          // Custom sorting for severity (Critical > High > Medium > Low)
          const severityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          aValue = severityOrder[a.severity] || 0;
          bValue = severityOrder[b.severity] || 0;
          break;
        case "status":
          aValue = a.status || "";
          bValue = b.status || "";
          break;
        case "description":
          aValue = a.description || "";
          bValue = b.description || "";
          break;
        default:
          aValue = a[sortConfig.key] || "";
          bValue = b[sortConfig.key] || "";
      }

      // Handle numeric sorting for severity
      if (sortConfig.key === "severity") {
        if (sortConfig.direction === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }

      // Handle string sorting
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortConfig.direction === "asc") {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [filteredDefects, sortConfig]);

  // Get sort icon for column headers
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return " ";
    }
    return sortConfig.direction === "asc" ? "▲" : "▼";
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => {
    // Reset to latest version instead of empty
    const latestVersion =
      sortedReleaseVersions.length > 0 ? sortedReleaseVersions[0] : "";

    setFilters({
      account_name: "",
      release_version: latestVersion,
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
          <h2>Defects Analytics Dashboard</h2>
          <p>
            {filters.release_version
              ? `Showing defects for ${filters.release_version} ${
                  sortedReleaseVersions.indexOf(filters.release_version) === 0
                    ? "(Latest)"
                    : ""
                }`
              : "Comprehensive view of all defects across completed releases"}
          </p>
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
              {sortedReleaseVersions.map((version) => (
                <option key={version} value={version}>
                  {version}{" "}
                  {sortedReleaseVersions.indexOf(version) === 0
                    ? "(Latest)"
                    : ""}
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
              <option value="Critical">🔴 Critical</option>
              <option value="High">🟠 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Status</option>
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

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card defect">
          <h3>Total Defects</h3>
          <div className="stat-number">{defectStats.totalDefects || 0}</div>
          <div className="stat-label">
            {filters.release_version
              ? `In ${filters.release_version}`
              : "Across All Releases"}
          </div>
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

        {/* <div className="stat-card in-progress">
          <h3>Critical Defects</h3>
          <div className="stat-number">
            {defectStats.severityBreakdown?.Critical || 0}
          </div>
          <div className="stat-label">High Priority Issues</div>
        </div> */}
      </div>

      {/* Filters Section */}
      {/* <div className="filters-section">
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
              {sortedReleaseVersions.map((version) => (
                <option key={version} value={version}>
                  {version}{" "}
                  {sortedReleaseVersions.indexOf(version) === 0
                    ? "(Latest)"
                    : ""}
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
              <option value="Critical">🔴 Critical</option>
              <option value="High">🟠 High</option>
              <option value="Medium">🟡 Medium</option>
              <option value="Low">🟢 Low</option>
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
      </div> */}

      {/* Results Info */}
      {(filters.account_name ||
        filters.release_version ||
        filters.severity ||
        filters.status) && (
        <div className="results-info">
          <p>
            Showing {sortedDefects.length} defect(s)
            {filters.account_name && ` for ${filters.account_name}`}
            {filters.release_version && ` in ${filters.release_version}`}
            {filters.severity && ` with ${filters.severity} severity`}
            {filters.status && ` with ${filters.status} status`}
          </p>
        </div>
      )}

      {/* Sortable Defects Table */}
      <div className="table-container">
        {sortedDefects.length === 0 ? (
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
                <th
                  onClick={() => handleSort("account_name")}
                  className="sortable-header"
                  title="Click to sort by Account"
                >
                  Account {getSortIcon("account_name")}
                </th>
                <th
                  onClick={() => handleSort("release_version")}
                  className="sortable-header"
                  title="Click to sort by Release Version"
                >
                  Release Version {getSortIcon("release_version")}
                </th>
                <th
                  onClick={() => handleSort("defect_id")}
                  className="sortable-header"
                  title="Click to sort by Defect ID"
                >
                  Defect ID {getSortIcon("defect_id")}
                </th>
                <th
                  onClick={() => handleSort("severity")}
                  className="sortable-header"
                  title="Click to sort by Severity"
                >
                  Severity {getSortIcon("severity")}
                </th>
                <th
                  onClick={() => handleSort("status")}
                  className="sortable-header"
                  title="Click to sort by Status"
                >
                  Status {getSortIcon("status")}
                </th>
                <th
                  onClick={() => handleSort("description")}
                  className="sortable-header"
                  title="Click to sort by Description"
                >
                  Description {getSortIcon("description")}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDefects.map((defect, index) => (
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
