import React, { useState, useEffect } from "react";

const Dashboard = ({ releases, accounts, regions }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const statusCounts = stats.statusCounts || {};
  // const upcomingReleases = releases.filter(
  //   (r) => new Date(r.release_date) >= new Date() && r.status === "Scheduled"
  // );
  const upcomingReleases = releases.filter((r) => {
    const d = new Date(r.release_date);
    const today = new Date();
    return (
      d >= today &&
      d <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
      r.status === "Scheduled"
    );
  });

  const inProgressReleases = releases.filter((r) => r.status === "In Progress");

  const blockedReleases = releases.filter((r) => r.status === "Blocked");

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Accounts</h3>
          <div className="stat-number">{stats.totalAccounts || 0}</div>
          {/* <div className="stat-label">Telecom Accounts</div> */}
        </div>

        <div className="stat-card scheduled">
          <h3>Scheduled</h3>
          <div className="stat-number">{statusCounts.Scheduled || 0}</div>
          {/* <div className="stat-label">Pending Releases</div> */}
        </div>

        <div className="stat-card in-progress">
          <h3>In Progress</h3>
          <div className="stat-number">{statusCounts["In Progress"] || 0}</div>
          {/* <div className="stat-label">Active Releases</div> */}
        </div>

        <div className="stat-card done">
          <h3>Completed</h3>
          <div className="stat-number">{statusCounts.Completed || 0}</div>
          {/* <div className="stat-label">Successful Releases</div> */}
        </div>

        <div className="stat-card canceled">
          <h3>Blocked</h3>
          <div className="stat-number">{statusCounts.Blocked || 0}</div>
          {/* <div className="stat-label">Canceled Releases</div> */}
        </div>
        <div className="stat-card defect">
          <h3>Defect Raised</h3>
          <div className="stat-number">{statusCounts.Defect || 0}</div>
          {/* <div className="stat-label">Canceled Releases</div> */}
        </div>
      </div>

      {blockedReleases.length > 0 && (
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
      )}
      {inProgressReleases.length > 0 && (
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
                {release.notes && (
                  <div className="notes">📝 {release.notes}</div>
                )}
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
      )}
    </div>
  );
};

export default Dashboard;
