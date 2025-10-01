import React, { useState } from "react";

const ReleaseTable = ({
  releases,
  regions,
  accounts,
  onEdit,
  onDelete,
  onFilter,
  readOnly = false,
}) => {
  const [filters, setFilters] = useState({
    release_version: "",
    account_region: "",
    status: "",
  });

  const getStatusClass = (status) => {
    switch (status) {
      case "Scheduled":
        return "status-scheduled";
      case "In Progress":
        return "status-in-progress";
      case "Done":
        return "status-done";
      case "Canceled":
        return "status-canceled";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Scheduled":
        return "📅";
      case "In Progress":
        return "⚡";
      case "Completed":
        return "✅";
      case "Canceled":
        return "🚫";
      default:
        return "❓";
    }
  };

  const handleFilterChange = (e) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value,
    };
    setFilters(newFilters);

    // Always call onFilter if it exists
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const clearFilters = () => {
    const emptyFilters = {
      release_version: "",
      account_region: "",
      status: "",
    };
    setFilters(emptyFilters);

    // Always call onFilter if it exists
    if (onFilter) {
      onFilter(emptyFilters);
    }
  };

  const getAccountRegion = (accountName) => {
    const account = accounts.find((acc) => acc.name === accountName);
    return account ? account.region : "";
  };

  const uniqueRegions = [...new Set(accounts.map((acc) => acc.region))].filter(
    Boolean
  );

  return (
    <div className="table-container">
      {/* Header for read-only view */}
      {/* {readOnly && (
        <div className="section-header">
          <h3>📋 All Releases (Read Only)</h3>
          <div className="read-only-badge">👁️ View Only Mode</div>
        </div>
      )} */}

      {/* Filters */}
      <div className="filters-section">
        {/* <h3>🔍 Filters</h3> */}
        <div className="filters-grid">
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
            <label>Account Region:</label>
            <select
              name="account_region"
              value={filters.account_region}
              onChange={handleFilterChange}
            >
              <option value="">All Regions</option>
              {uniqueRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
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
              <option value="Scheduled">📅 Scheduled</option>
              <option value="In Progress">⚡ In Progress</option>
              <option value="Completed">✅ Completed</option>
              <option value="Canceled">🚫 Canceled</option>
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
              🗑️ Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results count
      <div className="results-info">
        <p>
          📊 Showing {releases.length} release{releases.length !== 1 ? "s" : ""}
        </p>
      </div> */}

      <table className="releases-table">
        <thead>
          <tr>
            <th>Release Version</th>
            <th>Account Name</th>
            <th>Region</th>
            <th>Release Date</th>
            <th>Executor</th>
            <th>Status</th>
            <th>Notes</th>
            {!readOnly && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {releases.map((release) => (
            <tr key={release.id}>
              <td className="release-version">
                <span className="version-badge">
                  🏷️ {release.release_version || "N/A"}
                </span>
              </td>
              <td className="account-name">
                <strong>{release.account_name}</strong>
              </td>
              <td className="region-info">
                {getAccountRegion(release.account_name)}
              </td>
              <td>{new Date(release.release_date).toLocaleDateString()}</td>
              <td>👤 {release.executor}</td>
              <td>
                <span
                  className={`status-badge ${getStatusClass(release.status)}`}
                >
                  {getStatusIcon(release.status)} {release.status}
                </span>
              </td>
              <td className="notes-cell">
                {release.notes ? `📝 ${release.notes}` : "-"}
              </td>
              {!readOnly && (
                <td className="actions-cell">
                  <button
                    className="btn btn-sm btn-edit"
                    onClick={() => onEdit(release)}
                    title="Edit Release"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn btn-sm btn-delete"
                    onClick={() => onDelete(release.id)}
                    title="Delete Release"
                  >
                    🗑️ Delete
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {releases.length === 0 && (
        <div className="empty-state">
          <p>📋 No releases found matching the current filters.</p>
          {Object.values(filters).some((filter) => filter) && (
            <button onClick={clearFilters} className="btn btn-secondary">
              🗑️ Clear Filters to Show All
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReleaseTable;
