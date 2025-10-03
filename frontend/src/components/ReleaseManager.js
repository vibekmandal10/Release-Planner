import React, { useState } from "react";
import ReleaseForm from "./ReleaseForm";
import ReleaseTable from "./ReleaseTable";

const ReleaseManager = ({ releases, accounts, regions, onDataUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRelease, setEditingRelease] = useState(null);
  const [filteredReleases, setFilteredReleases] = useState(releases);

  React.useEffect(() => {
    setFilteredReleases(releases);
  }, [releases]);

  const handleSave = async (formData) => {
    try {
      const url = editingRelease
        ? `/api/releases/${editingRelease.id}`
        : "/api/releases";
      const method = editingRelease ? "PUT" : "POST";

      // Debug: Log the data being sent to API
      console.log('Sending to API:', formData);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save release");
      }

      const result = await response.json();
      console.log('API Response:', result);

      await onDataUpdate();
      setShowForm(false);
      setEditingRelease(null);
    } catch (error) {
      console.error('Save error:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEdit = (release) => {
    setEditingRelease(release);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this release?")) {
      try {
        const response = await fetch(`/api/releases/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete release");
        }

        await onDataUpdate();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleFilter = async (filters) => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`/api/releases?${queryParams}`);
      if (response.ok) {
        const data = await response.json();
        setFilteredReleases(data);
      }
    } catch (error) {
      console.error("Error filtering releases:", error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRelease(null);
  };

  const getStatusStats = () => {
    const stats = releases.reduce((acc, release) => {
      acc[release.status] = (acc[release.status] || 0) + 1;
      return acc;
    }, {});

    return [
      { label: "Scheduled", count: stats.Scheduled || 0, color: "#ffa726" },
      {
        label: "In Progress",
        count: stats["In Progress"] || 0,
        color: "#42a5f5",
      },
      { label: "Completed", count: stats.Completed || 0, color: "#66bb6a" },
      { label: "Blocked", count: stats.Blocked || 0, color: "#ef5350" },
    ];
  };

  return (
    <div className="release-manager">
      <div className="section-header">
        <h3>📅 Release Management</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Schedule New Release
        </button>
      </div>

      {/* Release Statistics */}
      <div className="release-stats">
        <h4>📊 Release Status Overview</h4>
        <div className="stats-grid">
          {getStatusStats().map((stat) => (
            <div key={stat.label} className="stat-item">
              <span className="stat-label">{stat.label}</span>
              <span
                className="stat-count"
                style={{ backgroundColor: stat.color }}
              >
                {stat.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Release Form Modal */}
      {showForm && (
        <ReleaseForm
          accounts={accounts}
          regions={regions}
          release={editingRelease}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Release Table */}
      <ReleaseTable
        releases={filteredReleases}
        regions={regions}
        accounts={accounts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onFilter={handleFilter}
        readOnly={false}
      />
    </div>
  );
};

export default ReleaseManager;
