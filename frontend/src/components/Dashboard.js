import React, { useState, useEffect, useMemo } from "react";

const Dashboard = ({ releases, accounts, regions }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    product: "", // Default to Monitoring
    environment: "", // Default to PROD
    release_version: "",
    account_region: "",
    status: "",
  });

  // Add sorting state and initial load tracking (same as ReleaseTable)
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Static filter options that don't change based on current filters (same as ReleaseTable)
  const filterOptions = useMemo(() => {
    // Define static options
    const staticProducts = ["Monitoring", "SRE"];
    const staticEnvironments = ["PROD", "DR", "DEV", "UAT"];
    const staticStatuses = ["Scheduled", "In Progress", "Completed", "Blocked"];

    // Get release versions from regions data and sort in descending order
    const releaseVersions = regions
      .map((region) => {
        // Extract only the version part after the dash for display
        const versionMatch = region.name.match(/-(.+)$/);
        return versionMatch ? versionMatch[1] : region.name;
      })
      .filter((version, index, array) => array.indexOf(version) === index) // Remove duplicates
      .sort((a, b) => {
        // Custom sorting for release versions (assuming format like R25.09, R25.10, etc.)
        // Extract the numeric part for proper sorting
        const getVersionNumber = (version) => {
          const match = version.match(/R(\d+)\.(\d+)/);
          if (match) {
            return parseFloat(`${match[1]}.${match[2]}`);
          }
          return 0;
        };

        const aNum = getVersionNumber(a);
        const bNum = getVersionNumber(b);

        // Sort in descending order (latest first)
        return bNum - aNum;
      });

    // Get unique regions from accounts (static)
    const accountRegions = [
      ...new Set(accounts.map((acc) => acc.region)),
    ].filter(Boolean);

    return {
      products: staticProducts,
      environments: staticEnvironments,
      releaseVersions: releaseVersions,
      accountRegions: accountRegions,
      statuses: staticStatuses,
    };
  }, [regions, accounts]);

  // Set default release version to the latest one when component mounts or regions change
  useEffect(() => {
    if (isInitialLoad && filterOptions.releaseVersions.length > 0) {
      const latestVersion = filterOptions.releaseVersions[0];
      setFilters((prev) => ({
        ...prev,
        release_version: latestVersion,
      }));

      setIsInitialLoad(false); // Mark initial load as complete
    }
  }, [filterOptions.releaseVersions, isInitialLoad]);

  // Apply filters using the same logic as ReleaseTable
  const filteredReleases = useMemo(() => {
    return releases.filter((release) => {
      // Filter by product
      if (filters.product && release.product !== filters.product) {
        return false;
      }

      // Filter by environment
      if (filters.environment && release.environment !== filters.environment) {
        return false;
      }

      // Filter by release version - check if release version contains the selected version
      if (filters.release_version) {
        if (
          !release.release_version ||
          !release.release_version.includes(filters.release_version)
        ) {
          return false;
        }
      }

      // Filter by account region
      if (filters.account_region) {
        const account = accounts.find(
          (acc) => acc.name === release.account_name
        );
        const accountRegion = account ? account.region : "";
        if (accountRegion !== filters.account_region) {
          return false;
        }
      }

      // Filter by status
      if (filters.status && release.status !== filters.status) {
        return false;
      }

      return true;
    });
  }, [releases, filters, accounts]);

  useEffect(() => {
    fetchStats();
  }, [releases, accounts, regions]);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountRegion = (accountName) => {
    const account = accounts.find((acc) => acc.name === accountName);
    return account ? account.region : "";
  };

  const handleFilterChange = (e) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value,
    };
    setFilters(newFilters);
  };

  // Modify clearFilters to reset to default values instead of empty
  const clearFilters = () => {
    const defaultFilters = {
      product: "", // Reset to default Monitoring
      environment: "", // Reset to default PROD
      release_version:
        filterOptions.releaseVersions.length > 0
          ? filterOptions.releaseVersions[0]
          : "", // Reset to latest version
      account_region: "",
      status: "",
    };
    setFilters(defaultFilters);
  };

  // Calculate enhanced statistics for filtered releases
  const calculateEnhancedStats = () => {
    const completedReleases = filteredReleases.filter(
      (r) => r.status === "Completed"
    );

    // Calculate total defects
    const totalDefects = completedReleases.reduce((total, release) => {
      return total + (release.defects ? release.defects.length : 0);
    }, 0);

    // Calculate average time taken
    const releasesWithTime = completedReleases.filter(
      (r) => r.time_taken_hours && !isNaN(parseFloat(r.time_taken_hours))
    );
    const totalTime = releasesWithTime.reduce((total, release) => {
      return total + parseFloat(release.time_taken_hours);
    }, 0);
    const avgTime =
      releasesWithTime.length > 0
        ? (totalTime / releasesWithTime.length).toFixed(1)
        : 0;

    return {
      totalDefects,
      avgTime,
      completedCount: completedReleases.length,
    };
  };

  // Calculate stats based on filtered releases and accounts
  const getFilteredStatusCounts = () => {
    return filteredReleases.reduce((acc, release) => {
      acc[release.status] = (acc[release.status] || 0) + 1;
      return acc;
    }, {});
  };

  // Calculate filtered accounts based on selected product
  // const getFilteredAccounts = () => {
  //   if (!filters.product) {
  //     // If no product filter, return all accounts
  //     return accounts;
  //   }

  //   // Filter accounts that have the selected product
  //   return accounts.filter(
  //     (account) =>
  //       account.products &&
  //       account.products.includes(filters.product)
  //   );
  // };

  const getFilteredAccounts = () => {
    let filteredAccounts = accounts;

    // Filter by product if selected
    if (filters.product) {
      filteredAccounts = filteredAccounts.filter(
        (account) =>
          account.products && account.products.includes(filters.product)
      );
    }

    // Filter by region if selected
    if (filters.account_region) {
      filteredAccounts = filteredAccounts.filter(
        (account) => account.region === filters.account_region
      );
    }

    return filteredAccounts;
  };
  // Calculate account statistics by region for the selected product
  const getAccountStatsByRegion = () => {
    const filteredAccounts = getFilteredAccounts();

    return filteredAccounts.reduce((acc, account) => {
      const region = account.region;
      if (!acc[region]) {
        acc[region] = 0;
      }
      acc[region]++;
      return acc;
    }, {});
  };

  const filteredStatusCounts = getFilteredStatusCounts();
  const enhancedStats = calculateEnhancedStats();
  const filteredAccounts = getFilteredAccounts();
  const accountStatsByRegion = getAccountStatsByRegion();

  const upcomingReleases = filteredReleases.filter((r) => {
    const d = new Date(r.release_date);
    const today = new Date();

    return (
      d.getDate() >= today.getDate() &&
      d <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
      r.status === "Scheduled"
    );
  });

  const inProgressReleases = filteredReleases.filter(
    (r) => r.status === "In Progress"
  );
  const blockedReleases = filteredReleases.filter(
    (r) => r.status === "Blocked"
  );

  // Check if any filters are different from defaults
  const hasActiveFilters =
    filters.product !== "Monitoring" ||
    filters.environment !== "PROD" ||
    (filters.release_version !== "" &&
      filters.release_version !== (filterOptions.releaseVersions[0] || "")) ||
    filters.account_region !== "" ||
    filters.status !== "";

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Handle empty state
  if (
    !stats ||
    (stats.totalAccounts === 0 &&
      stats.totalReleases === 0 &&
      stats.totalRegions === 0)
  ) {
    return (
      <div className="dashboard">
        <div className="empty-dashboard">
          <div className="empty-state-card">
            <h2>🚀 Welcome to Release Planning Dashboard</h2>
            <p>Get started by setting up your system:</p>
            <div className="setup-steps">
              <div className="setup-step">
                <span className="step-number">1</span>
                <div className="step-content">
                  <h3>Add Release Versions</h3>
                  <p>
                    Go to Admin → Release Versions to add versions like R25.09,
                    R25.10, etc.
                  </p>
                </div>
              </div>
              <div className="setup-step">
                <span className="step-number">2</span>
                <div className="step-content">
                  <h3>Add Accounts</h3>
                  <p>
                    Go to Admin → Accounts & Regions to add telecom accounts and
                    their regions.
                  </p>
                </div>
              </div>
              <div className="setup-step">
                <span className="step-number">3</span>
                <div className="step-content">
                  <h3>Schedule Releases</h3>
                  <p>
                    Go to All Releases to start scheduling releases for your
                    accounts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Dashboard Header with Enhanced Filters */}
      <div className="dashboard-header1">
        <div className="dashboard-filter-section">
          <div className="filters-section">
            <div className="filters-grid">
              {/* Product Filter */}
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

              {/* Environment Filter */}
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

              {/* Release Version Filter */}
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
                      {version}{" "}
                      {filterOptions.releaseVersions.indexOf(version) === 0
                        ? "(Latest)"
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Account Region Filter */}
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

              {/* Status Filter */}
              <div className="filter-group">
                <label>Status:</label>
                <select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                >
                  <option value="">All Status</option>
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

              {/* Clear Filters Button */}
              <div className="filter-actions">
                <button
                  onClick={clearFilters}
                  className="btn btn-secondary btn-sm"
                >
                  🔄 Reset to Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>
            Total Accounts
            {/* {filters.product && (
              <span className="stat-subtitle">({filters.product})</span>
            )} */}
          </h3>
          <div className="stat-number">{filteredAccounts.length}</div>
          {/* {filters.product && (
            <div className="stat-breakdown">
              {Object.entries(accountStatsByRegion).map(([region, count]) => (
                <div key={region} className="region-stat">
                  <span className="region-name">{region}:</span>
                  <span className="region-count">{count}</span>
                </div>
              ))}
            </div>
          )} */}
        </div>

        <div className="stat-card scheduled">
          <h3>Scheduled</h3>
          <div className="stat-number">
            {filteredStatusCounts.Scheduled || 0}
          </div>
        </div>

        <div className="stat-card in-progress">
          <h3>In Progress</h3>
          <div className="stat-number">
            {filteredStatusCounts["In Progress"] || 0}
          </div>
        </div>

        <div className="stat-card done">
          <h3>Completed</h3>
          <div className="stat-number">
            {filteredStatusCounts.Completed || 0}
          </div>
        </div>

        <div className="stat-card canceled">
          <h3>Blocked</h3>
          <div className="stat-number">{filteredStatusCounts.Blocked || 0}</div>
        </div>

        <div className="stat-card defect">
          <h3>Total Defects</h3>
          <div className="stat-number">{enhancedStats.totalDefects}</div>
        </div>

        <div className="stat-card performance">
          <h3>Avg Time(H)</h3>
          <div className="stat-number">{enhancedStats.avgTime}</div>
        </div>
      </div>

      {/* Account Breakdown by Region - Show when product is selected */}
      {/* {filters.product && filteredAccounts.length > 0 && (
        <div className="account-breakdown">
          <h2>🏢 {filters.product} Accounts by Region</h2>
          <div className="breakdown-grid">
            {Object.entries(accountStatsByRegion).map(([region, count]) => (
              <div key={region} className="breakdown-card">
                <h4>{region}</h4>
                <div className="breakdown-number">{count}</div>
                <div className="breakdown-label">accounts</div>
                <div className="account-list">
                  {filteredAccounts
                    .filter((acc) => acc.region === region)
                    .map((acc) => (
                      <span key={acc.id} className="account-tag">
                        {acc.name}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* {blockedReleases.length > 0 && (
        <div className="upcoming-releases">
          <h2>🚫 Blocked Accounts</h2>
          <div className="upcoming-list">
            {blockedReleases.slice(0, 5).map((release) => (
              <div key={release.id} className="upcoming-item">
                <div className="release-info">
                  <h4>{release.account_name}</h4>
                  <span className="release-date">
                    {new Date(release.release_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="executor">👤 {release.executor}</div>
                {release.notes && (
                  <div className="notes">📝 {release.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )} */}
      {blockedReleases.length > 0 && (
        <div className="upcoming-releases">
          <h2>🚫 Blocked Accounts</h2>
          <div className="upcoming-list">
            {blockedReleases.map((release) => (
              <div key={release.id} className="upcoming-item">
                <div className="release-info">
                  <div className="release-details">
                    <span className="dashboard-release-version">
                      🏷️ {release.release_version || "N/A"}
                    </span>
                    {/* <span className="produsct-env"> {release.product}</span> */}
                  </div>
                  <div className="account-details">
                    <h4>
                      {release.account_name}
                      {"  "}
                    </h4>
                    <p>{new Date(release.release_date).toLocaleDateString()}</p>
                    {/* <span className="release-date">
                      {new Date(release.release_date).toLocaleDateString()}
                    </span> */}
                  </div>
                </div>
                <div className="executor">👤 {release.executor}</div>
                {release.notes && (
                  <div className="notes1">📝 {release.notes}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {inProgressReleases.length > 0 && (
        <div className="upcoming-releases">
          <h2>⚡ In Progress Accounts</h2>
          <div className="upcoming-list">
            {inProgressReleases.map((release) => (
              <div key={release.id} className="upcoming-item">
                <div className="release-info">
                  <div className="release-details">
                    <span className="dashboard-release-version">
                      🏷️ {release.release_version || "N/A"}
                    </span>
                    {/* <span className="produsct-env"> {release.product}</span> */}
                  </div>
                  <div className="account-details">
                    <h4>
                      {release.account_name}
                      {"  "}
                    </h4>
                    <p>{new Date(release.release_date).toLocaleDateString()}</p>
                    {/* <span className="release-date">
                      {new Date(release.release_date).toLocaleDateString()}
                    </span> */}
                  </div>
                </div>
                <div className="executor">👤 {release.executor}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingReleases.length > 0 && (
        <div className="upcoming-releases">
          <h2>📅 Upcoming Accounts in Next 7 Days</h2>
          <div className="upcoming-list">
            {upcomingReleases.map((release) => (
              <div key={release.id} className="upcoming-item">
                <div className="release-info">
                  <div className="release-details">
                    <span className="dashboard-release-version">
                      🏷️ {release.release_version || "N/A"}
                    </span>
                    {/* <span className="produsct-env"> {release.product}</span> */}
                  </div>
                  <div className="account-details">
                    <h4>
                      {release.account_name}
                      {"  "}
                    </h4>
                    <p>{new Date(release.release_date).toLocaleDateString()}</p>
                    {/* <span className="release-date">
                      {new Date(release.release_date).toLocaleDateString()}
                    </span> */}
                  </div>
                </div>
                <div className="executor">👤 {release.executor}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* {inProgressReleases.length > 0 && (
        <div className="upcoming-releases">
          <h2>⚡ In Progress Accounts</h2>
          <div className="upcoming-list">
            {inProgressReleases.slice(0, 5).map((release) => (
              <div key={release.id} className="upcoming-item">
                <div className="release-info">
                  <h4>{release.account_name}</h4>
                  <span className="release-date">
                    {new Date(release.release_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="executor">👤 {release.executor}</div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* {upcomingReleases.length > 0 && (
        <div className="upcoming-releases">
          <h2>📅 Upcoming Accounts in Next 7 Days</h2>
          <div className="upcoming-list">
            {upcomingReleases.slice(0, 5).map((release) => (
              <div key={release.id} className="upcoming-item">
                <div className="release-info">
                  <h4>{release.account_name}</h4>
                  <span className="release-date">
                    {new Date(release.release_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="executor">👤 {release.executor}</div>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {filteredReleases.length === 0 && (
        <div className="empty-state">
          <h3>📋 No releases found with current filters</h3>
          <p>Try adjusting your filters or reset to defaults.</p>
          <button onClick={clearFilters} className="btn btn-secondary">
            🔄 Reset to Defaults
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
