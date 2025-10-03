import React, { useState, useEffect } from "react";

const Dashboard = ({ releases, accounts, regions }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReleaseVersion, setSelectedReleaseVersion] = useState("");
  const [filteredReleases, setFilteredReleases] = useState(releases);

  useEffect(() => {
    fetchStats();
  }, [releases, accounts, regions]);

  useEffect(() => {
    // Filter releases based on selected release version
    if (selectedReleaseVersion) {
      const filtered = releases.filter(
        (release) => release.release_version === selectedReleaseVersion
      );
      setFilteredReleases(filtered);
    } else {
      setFilteredReleases(releases);
    }
  }, [selectedReleaseVersion, releases]);

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

  const handleReleaseVersionChange = (e) => {
    setSelectedReleaseVersion(e.target.value);
  };

  const clearFilter = () => {
    setSelectedReleaseVersion("");
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

    // Calculate defect rate
    const defectRate =
      completedReleases.length > 0
        ? (totalDefects / completedReleases.length).toFixed(1)
        : 0;

    return {
      totalDefects,
      avgTime,
      defectRate,
      completedCount: completedReleases.length,
    };
  };

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

  // Calculate stats based on filtered releases
  const getFilteredStatusCounts = () => {
    return filteredReleases.reduce((acc, release) => {
      acc[release.status] = (acc[release.status] || 0) + 1;
      return acc;
    }, {});
  };

  const filteredStatusCounts = getFilteredStatusCounts();
  const enhancedStats = calculateEnhancedStats();

  const upcomingReleases = filteredReleases.filter((r) => {
    const d = new Date(r.release_date);
    const today = new Date();
    return (
      d >= today &&
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

  return (
    <div className="dashboard">
      {/* Dashboard Header with Filter */}
      <div className="dashboard-header1">
        <div className="dashboard-filter-section">
          <div className="filter-container">
            <div className="filter-label">
              <span className="filter-text">Filter by Release Version</span>
            </div>
            <div className="filter-controls">
              <div className="select-wrapper">
                <select
                  value={selectedReleaseVersion}
                  onChange={handleReleaseVersionChange}
                  className="dashboard-select"
                >
                  <option value="">All Release Versions</option>
                  {regions.map((region) => (
                    <option key={region.id} value={region.name}>
                      {region.name}
                    </option>
                  ))}
                </select>
                <span className="select-arrow">▼</span>
              </div>
              {selectedReleaseVersion && (
                <button
                  onClick={clearFilter}
                  className="btn btn-clear-filter"
                  title="Clear Filter"
                >
                  <span className="clear-icon">✕</span>
                  Clear
                </button>
              )}
            </div>
          </div>

          {selectedReleaseVersion && (
            <div className="filter-info-banner">
              <h3>
                Showing data for:
                <span className="highlight">{selectedReleaseVersion}</span>
              </h3>
              <p>
                {filteredReleases.length} release
                {filteredReleases.length !== 1 ? "s" : ""} found
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Accounts</h3>
          <div className="stat-number">{stats.totalAccounts || 0}</div>
          {/* <div className="stat-label">Registered Accounts</div> */}
        </div>

        <div className="stat-card scheduled">
          <h3>Scheduled</h3>
          <div className="stat-number">
            {filteredStatusCounts.Scheduled || 0}
          </div>
          {/* <div className="stat-label">Pending Releases</div> */}
        </div>

        <div className="stat-card in-progress">
          <h3>In Progress</h3>
          <div className="stat-number">
            {filteredStatusCounts["In Progress"] || 0}
          </div>
          {/* <div className="stat-label">Active Releases</div> */}
        </div>

        <div className="stat-card done">
          <h3>Completed</h3>
          <div className="stat-number">
            {filteredStatusCounts.Completed || 0}
          </div>
          {/* <div className="stat-label">Successful Releases</div> */}
        </div>

        <div className="stat-card canceled">
          <h3>Blocked</h3>
          <div className="stat-number">{filteredStatusCounts.Blocked || 0}</div>
          {/* <div className="stat-label">Blocked Releases</div> */}
        </div>

        <div className="stat-card defect">
          <h3>Total Defects</h3>
          <div className="stat-number">{enhancedStats.totalDefects} </div>
          {/* <div className="stat-label">
            {selectedReleaseVersion
              ? `In ${selectedReleaseVersion}`
              : "Across All Releases"}
          </div> */}
        </div>

        <div className="stat-card performance">
          <h3>Avg Time(H)</h3>
          <div className="stat-number">{enhancedStats.avgTime}</div>
          {/* <div className="stat-label">Hours per Release</div> */}
        </div>
      </div>

      {/* Performance Insights Section
      {(enhancedStats.completedCount > 0 || selectedReleaseVersion) && (
        <div className="performance-insights">
          <h3>📊 Performance Insights</h3>
          <div className="insights-grid">
            <div className="insight-card">
              <div className="insight-icon">⏱️</div>
              <div className="insight-content">
                <h4>Average Release Time</h4>
                <p>
                  {enhancedStats.avgTime > 0 
                    ? `${enhancedStats.avgTime} hours average completion time`
                    : 'No time data available for completed releases'
                  }
                </p>
                {selectedReleaseVersion && (
                  <small>For {selectedReleaseVersion} releases</small>
                )}
              </div>
            </div>
            
            <div className="insight-card">
              <div className="insight-icon">🐛</div>
              <div className="insight-content">
                <h4>Quality Metrics</h4>
                <p>
                  {enhancedStats.totalDefects} total defects across {enhancedStats.completedCount} completed releases
                </p>
                {selectedReleaseVersion && (
                  <small>Filtered for {selectedReleaseVersion}</small>
                )}
              </div>
            </div>
          </div>
        </div>
      )} */}

      {blockedReleases.length > 0 && (
        <div className="upcoming-releases">
          <h2>🚫 Blocked Accounts</h2>
          <div className="upcoming-list">
            {blockedReleases.slice(0, 5).map((release) => (
              <div key={release.id} className="upcoming-item">
                <div className="release-info">
                  <h4>{release.account_name}</h4>
                  {/* <span className="release-version-badge">
                    🏷️ {release.release_version}
                  </span> */}
                  <span className="release-date">
                    {new Date(release.release_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="executor">👤 {release.executor}</div>
                {/* {release.notes && (
                  <div className="notes">📝 {release.notes}</div>
                )} */}
              </div>
            ))}
          </div>
        </div>
      )}

      {inProgressReleases.length > 0 && (
        <div className="upcoming-releases">
          <h2>⚡ In Progress Accounts</h2>
          <div className="upcoming-list">
            {inProgressReleases.slice(0, 5).map((release) => (
              <div key={release.id} className="upcoming-item">
                <div className="release-info">
                  <h4>{release.account_name}</h4>
                  {/* <span className="release-version-badge">
                    🏷️ {release.release_version}
                  </span> */}
                  <span className="release-date">
                    {new Date(release.release_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="executor">👤 {release.executor}</div>
                {/* {release.notes && (
                  <div className="notes">📝 {release.notes}</div>
                )} */}
              </div>
            ))}
          </div>
        </div>
      )}

      {upcomingReleases.length > 0 && (
        <div className="upcoming-releases">
          <h2>📅 Upcoming Accounts in Next 7 Days</h2>
          <div className="upcoming-list">
            {upcomingReleases.slice(0, 5).map((release) => (
              <div key={release.id} className="upcoming-item">
                <div className="release-info">
                  <h4>{release.account_name}</h4>
                  {/* <span className="release-version-badge">
                    🏷️ {release.release_version}
                  </span> */}
                  <span className="release-date">
                    {new Date(release.release_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="executor">👤 {release.executor}</div>
                {/* {release.notes && (
                  <div className="notes">📝 {release.notes}</div>
                )} */}
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredReleases.length === 0 && selectedReleaseVersion && (
        <div className="empty-state">
          <h3>📋 No releases found for {selectedReleaseVersion}</h3>
          <p>
            Try selecting a different release version or clear the filter to see
            all releases.
          </p>
          <button onClick={clearFilter} className="btn btn-secondary">
            🗑️ Clear Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
