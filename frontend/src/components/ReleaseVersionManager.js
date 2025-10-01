import React, { useState } from "react";

const ReleaseVersionManager = ({ regions, onDataUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingRegion
        ? `/api/regions/${editingRegion.id}`
        : "/api/regions";
      const method = editingRegion ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save region");
      }

      await onDataUpdate();
      setShowForm(false);
      setEditingRegion(null);
      setFormData({ name: "", description: "" });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleEdit = (region) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      description: region.description,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this release version?")
    ) {
      try {
        const response = await fetch(`/api/regions/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete region");
        }

        await onDataUpdate();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingRegion(null);
    setFormData({ name: "", description: "" });
  };

  return (
    <div className="version-manager">
      <div className="section-header">
        <h3>🏷️ Release Versions Management</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Add New Version
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h4>{editingRegion ? "✏️ Edit Version" : "➕ Add New Version"}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Version Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., R26.03"
                required
              />
            </div>
            <div className="form-group">
              <label>Description:</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="e.g., Release 26.03 - March 2026"
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingRegion ? "💾 Update" : "➕ Add"} Version
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="versions-list">
        <h4>📋 Existing Release Versions</h4>
        <div className="versions-grid">
          {regions.map((region) => (
            <div key={region.id} className="version-card">
              <div className="version-info">
                <h5>{region.name}</h5>
                <p>{region.description}</p>
                <small>
                  Created: {new Date(region.created_at).toLocaleDateString()}
                </small>
              </div>
              <div className="version-actions">
                <button
                  className="btn btn-sm btn-edit"
                  onClick={() => handleEdit(region)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-sm btn-delete"
                  onClick={() => handleDelete(region.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReleaseVersionManager;
