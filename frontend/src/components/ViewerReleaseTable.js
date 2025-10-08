import React, { useState, useMemo } from "react";

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
    product: "",
    environment: "",
    release_version: "",
    account_region: "",
    status: "",
  });

  // Static filter options - these never change regardless of current filters
  const filterOptions = useMemo(() => {
    // Define static options that don't depend on current data
    const staticProducts = ["Monitoring", "SRE"];
    const staticEnvironments = ["PROD", "DR", "DEV", "UAT"];
    const staticStatuses = ["Scheduled", "In Progress", "Completed", "Blocked"];
    
    // Get unique release versions from regions (assuming this is your source)
    const releaseVersions = regions.map(region => region.name);
    
    // Get unique regions from accounts
    const accountRegions = [...new Set(accounts.map(acc => acc.region))].filter(Boolean);

    return {
      products: staticProducts,
      environments: staticEnvironments,
      releaseVersions: releaseVersions,
      accountRegions: accountRegions,
      statuses: staticStatuses
    };
  }, [regions, accounts]); // Only depends on regions and accounts, not releases

  const getStatusClass = (status) => {
    switch (status) {
      case "Scheduled":
        return "status-scheduled";
      case "In Progress":
        return "status-in-progress";
      case "Done":
        return "status-done";
      case "Blocked":
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
      case "Blocked":
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

    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const clearFilters = () => {
    const emptyFilters = {
      product: "",
      environment: "",
      release_version: "",
      account_region: "",
      status: "",
    };
    setFilters(emptyFilters);

    if (onFilter) {
      onFilter(emptyFilters);
    }
  };

  const getAccountRegion = (accountName) => {
    const account = accounts.find((acc) => acc.name === accountName);
    return account ? account.region : "";
  };

  return (
    <div className="table-container">
      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Product:</label>
            <select
              name="product"
              value={filters.product}
              onChange={handleFilterChange}
            >
              <option value="">All Products</option>
              {filterOptions.products.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Environment:</label>
            <select
              name="environment"
              value={filters.environment}
              onChange={handleFilterChange}
            >
              <option value="">All Environments</option>
              {filterOptions.environments.map((environment) => (
                <option key={environment} value={environment}>
                  {environment}
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
              {filterOptions.releaseVersions.map((version) => (
                <option key={version} value={version}>
                  {version}
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
              {filterOptions.accountRegions.map((region) => (
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
              {filterOptions.statuses.map((status) => (
                <option key={status} value={status}>
                  {status === "Scheduled" && "📅 "}
                  {status === "In Progress" && "⚡ "}
                  {status === "Completed" && "✅ "}
                  {status === "Blocked" && "🚫 "}
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
              🗑️ Clear Filters
            </button>
          </div>
        </div>
      </div>

      <table className="releases-table">
        <thead>
          <tr>
            <th>Product/Env</th>
            <th>Release Version</th>
            <th>Account Name</th>
            <th>Region</th>
            <th>Release Date</th>
            <th>Executor</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {releases.map((release) => (
            <tr key={release.id}>
              <td className="">
                <strong>
                  {release.product}/{release.environment}
                </strong>
              </td>
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
                {release.completion_notes
                  ? `${release.completion_notes}`
                  : `${release.notes || ''}`}
              </td>
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
