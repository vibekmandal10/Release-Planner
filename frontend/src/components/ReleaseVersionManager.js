import React, { useState } from "react";

const ReleaseVersionManager = ({ regions, onDataUpdate }) => {
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
    type: "Enhancement", // Enhancement, Bug Fix, New Feature
    priority: "Medium", // Low, Medium, High, Critical
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
        type: "Enhancement",
        priority: "Medium",
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
      type: "Enhancement",
      priority: "Medium",
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
        type: "Enhancement",
        priority: "Medium",
      });
    }
  };

  const removeFeature = (featureId) => {
    setFormData({
      ...formData,
      features: formData.features.filter((feature) => feature.id !== featureId),
    });
  };

  const getFeatureTypeIcon = (type) => {
    switch (type) {
      case "New Feature":
        return "🆕";
      case "Enhancement":
        return "⚡";
      case "Bug Fix":
        return "🐛";
      case "Security":
        return "🔒";
      case "Performance":
        return "🚀";
      default:
        return "📋";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "Critical":
        return "🔴";
      case "High":
        return "🟠";
      case "Medium":
        return "🟡";
      case "Low":
        return "🟢";
      default:
        return "⚪";
    }
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
              <label>Description1:</label>
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
                      rows="2"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Type:</label>
                      <select
                        value={currentFeature.type}
                        onChange={(e) =>
                          setCurrentFeature({
                            ...currentFeature,
                            type: e.target.value,
                          })
                        }
                      >
                        <option value="New Feature">🆕 New Feature</option>
                        <option value="Enhancement">⚡ Enhancement</option>
                        <option value="Bug Fix">🐛 Bug Fix</option>
                        <option value="Security">🔒 Security</option>
                        <option value="Performance">🚀 Performance</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Priority:</label>
                      <select
                        value={currentFeature.priority}
                        onChange={(e) =>
                          setCurrentFeature({
                            ...currentFeature,
                            priority: e.target.value,
                          })
                        }
                      >
                        <option value="Critical">🔴 Critical</option>
                        <option value="High">🟠 High</option>
                        <option value="Medium">🟡 Medium</option>
                        <option value="Low">🟢 Low</option>
                      </select>
                    </div>
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
                          <div className="feature-title">
                            <span className="feature-type">
                              {getFeatureTypeIcon(feature.type)} {feature.type}
                            </span>
                            <span className="feature-priority">
                              {getPriorityIcon(feature.priority)}{" "}
                              {feature.priority}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-sm btn-delete"
                            onClick={() => removeFeature(feature.id)}
                            title="Remove Feature"
                          >
                            ❌
                          </button>
                        </div>
                        <h6>{feature.name}</h6>
                        <p>{feature.description}</p>
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

      <div className="versions-list">
        <h4>📋 Existing Release Versions</h4>
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
                            {getFeatureTypeIcon(feature.type)} {feature.name}
                          </span>
                        </div>
                      ))}
                      {region.features.length > 3 && (
                        <span className="more-features">
                          +{region.features.length - 3} more
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
              🏷️ No release versions found. Add your first release version to
              get started!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReleaseVersionManager;
