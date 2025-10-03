import React, { useState } from "react";

const RegionManager = ({ regions, onDataUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    features: [],
  });
  const [currentFeature, setCurrentFeature] = useState({
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
        throw new Error(error.error || "Failed to save release version");
      }

      await onDataUpdate();
      setShowForm(false);
      setEditingRegion(null);
      setFormData({ name: "", description: "", features: [] });
      setCurrentFeature({
        name: "",
        description: "",
      });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleEdit = (region) => {
    setEditingRegion(region);
    setFormData({
      name: region.name,
      description: region.description,
      features: region.features || [],
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
          throw new Error(error.error || "Failed to delete release version");
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
    setFormData({ name: "", description: "", features: [] });
    setCurrentFeature({
      name: "",
      description: "",
    });
  };

  const addFeature = () => {
    if (currentFeature.name.trim() && currentFeature.description.trim()) {
      const newFeature = {
        id: Date.now(), // Simple ID generation
        ...currentFeature,
      };
      setFormData({
        ...formData,
        features: [...formData.features, newFeature],
      });
      setCurrentFeature({
        name: "",
        description: "",
      });
    }
  };

  const removeFeature = (featureId) => {
    setFormData({
      ...formData,
      features: formData.features.filter((feature) => feature.id !== featureId),
    });
  };

  return (
    <div className="region-manager">
      <div className="section-header">
        <h3>🏷️ Release Versions Management</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Add New Version
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <h4>
            {editingRegion
              ? "✏️ Edit Release Version"
              : "➕ Add New Release Version"}
          </h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Version Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., R25.09"
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
                placeholder="e.g., Release 25.09 - September 2025"
                required
              />
            </div>

            {/* Features Section */}
            <div className="features-section">
              <h5>🚀 Release Features</h5>

              {/* Add New Feature */}
              <div className="add-feature-form">
                <div className="feature-inputs">
                  <div className="form-group">
                    <label>Feature Name:</label>
                    <input
                      type="text"
                      value={currentFeature.name}
                      onChange={(e) =>
                        setCurrentFeature({
                          ...currentFeature,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g., User Authentication Enhancement"
                    />
                  </div>

                  <div className="form-group">
                    <label>Feature Description:</label>
                    <textarea
                      value={currentFeature.description}
                      onChange={(e) =>
                        setCurrentFeature({
                          ...currentFeature,
                          description: e.target.value,
                        })
                      }
                      placeholder="Detailed description of the feature"
                      rows="3"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={addFeature}
                  disabled={
                    !currentFeature.name.trim() ||
                    !currentFeature.description.trim()
                  }
                >
                  ➕ Add Feature
                </button>
              </div>

              {/* Features List */}
              {formData.features.length > 0 && (
                <div className="features-list">
                  <h6>
                    📋 Features in this Release ({formData.features.length})
                  </h6>
                  <div className="features-grid">
                    {formData.features.map((feature) => (
                      <div key={feature.id} className="feature-card">
                        <div className="feature-header">
                          <h6 className="feature-name">🚀 {feature.name}</h6>
                          <button
                            type="button"
                            className="btn btn-sm btn-delete"
                            onClick={() => removeFeature(feature.id)}
                            title="Remove Feature"
                          >
                            ❌
                          </button>
                        </div>
                        <p className="feature-description">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

      {/* Release Versions Grid */}
      <div className="versions-grid">
        {regions.map((region) => (
          <div key={region.id} className="version-card">
            <div className="version-info">
              <h5>🏷️ {region.name}</h5>
              <p>{region.description}</p>

              {/* Features Summary */}
              {region.features && region.features.length > 0 && (
                <div className="features-summary">
                  <h6>🚀 Features ({region.features.length})</h6>
                  <div className="features-preview">
                    {region.features.slice(0, 3).map((feature) => (
                      <div key={feature.id} className="feature-preview">
                        <span className="feature-badge">
                          🚀 {feature.name}
                        </span>
                      </div>
                    ))}
                    {region.features.length > 3 && (
                      <span className="more-features">
                        +{region.features.length - 3} more features
                      </span>
                    )}
                  </div>
                </div>
              )}

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

      {regions.length === 0 && (
        <div className="empty-state">
          <p>
            🏷️ No release versions found. Add your first release version to get
            started!
          </p>
        </div>
      )}
    </div>
  );
};

export default RegionManager;