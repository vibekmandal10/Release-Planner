import React, { useState, useEffect } from "react";

const ReleaseForm = ({ accounts, regions, release, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    account_name: "",
    release_date: "",
    executor: "",
    status: "Scheduled",
    notes: "",
    release_version: "",
    product: "", // New field for product selection
    environment: "", // New field for environment selection
    // Completion tracking fields
    completion_date: "",
    time_taken_hours: "",
    defects_raised: "",
    defect_details: "",
    completion_notes: "",
  });

  // Available products and environments
  const availableProducts = [
    { id: 1, name: "Monitoring", icon: "📊" },
    { id: 2, name: "SRE", icon: "🔧" },
  ];

  const availableEnvironments = [
    { id: 1, name: "PROD", icon: "🔴" },
    { id: 2, name: "DR", icon: "🟠" },
    { id: 3, name: "DEV", icon: "🟢" },
    { id: 4, name: "UAT", icon: "🟡" },
  ];

  // Separate state for managing individual defects
  const [defects, setDefects] = useState([]);
  const [filteredAccounts, setFilteredAccounts] = useState(accounts);

  useEffect(() => {
    if (release) {
      setFormData({
        account_name: release.account_name,
        release_date: release.release_date,
        executor: release.executor,
        status: release.status,
        notes: release.notes || "",
        release_version: release.release_version || "",
        product: release.product || "",
        environment: release.environment || "",
        // Completion fields
        completion_date: release.completion_date || "",
        time_taken_hours: release.time_taken_hours || "",
        defects_raised: release.defects_raised || "",
        defect_details: release.defect_details || "",
        completion_notes: release.completion_notes || "",
      });

      // Parse existing defects if they exist
      if (release.defects && Array.isArray(release.defects)) {
        setDefects(release.defects);
      } else if (release.defect_details) {
        setDefects([
          {
            id: 1,
            defect_id: "",
            description: release.defect_details,
            severity: "Medium",
            status: "Open",
          },
        ]);
      }
    }
  }, [release]);

  // Filter accounts based on selected product
  useEffect(() => {
    if (formData.product) {
      const filtered = accounts.filter(
        (account) =>
          account.products && account.products.includes(formData.product)
      );
      // setFilteredAccounts(filtered);

      // Reset account selection if current account doesn't support selected product
      if (formData.account_name) {
        const currentAccount = accounts.find(
          (acc) => acc.name === formData.account_name
        );
        if (!currentAccount?.products?.includes(formData.product)) {
          setFormData((prev) => ({ ...prev, account_name: "" }));
        }
      }
    } else {
      setFilteredAccounts(accounts);
    }
  }, [formData.product, accounts]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Auto-populate completion date when status changes to Completed
    if (name === "status" && value === "Completed") {
      setFormData({
        ...formData,
        [name]: value,
        completion_date:
          formData.completion_date || new Date().toISOString().split("T")[0],
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // Defect management functions
  const addDefect = () => {
    const newDefect = {
      id: Date.now(),
      defect_id: "",
      description: "",
      severity: "Medium",
      status: "Open",
    };
    setDefects([...defects, newDefect]);
  };

  const removeDefect = (defectId) => {
    setDefects(defects.filter((defect) => defect.id !== defectId));
  };

  const updateDefect = (defectId, field, value) => {
    setDefects(
      defects.map((defect) =>
        defect.id === defectId ? { ...defect, [field]: value } : defect
      )
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.product) {
      alert("Please select a product (Monitoring or SRE)");
      return;
    }

    if (!formData.environment) {
      alert("Please select an environment (PROD, DR, DEV, or UAT)");
      return;
    }

    // Validation for completed releases
    if (formData.status === "Completed") {
      if (!formData.completion_date) {
        alert("Please provide completion date for completed releases");
        return;
      }
      if (!formData.time_taken_hours) {
        alert("Please provide time taken for completed releases");
        return;
      }

      // Validate defects if any are added
      if (defects.length > 0) {
        const invalidDefects = defects.filter(
          (defect) => !defect.defect_id.trim() || !defect.description.trim()
        );

        if (invalidDefects.length > 0) {
          alert(
            "Please fill in all defect IDs and descriptions before submitting"
          );
          return;
        }
      }
    }

    // Prepare data with defects
    const submitData = {
      ...formData,
      defects_raised: defects.length.toString(),
      defects: defects,
      defect_details: defects
        .map((d) => `${d.defect_id}: ${d.description}`)
        .join("; "),
    };

    console.log("Submitting release data:", submitData);
    onSave(submitData);
  };

  const isCompleted = formData.status === "Completed";
  const isBlocked = formData.status === "Blocked";

  const getProductIcon = (productName) => {
    const product = availableProducts.find((p) => p.name === productName);
    return product ? product.icon : "📦";
  };

  const getEnvironmentIcon = (envName) => {
    const env = availableEnvironments.find((e) => e.name === envName);
    return env ? env.icon : "⚪";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{release ? "✏️ Edit Release" : "➕ Schedule New Release"}</h2>
        <form onSubmit={handleSubmit}>
          {/* Release Version Selection */}
          <div className="form-group">
            <label>
              Release Version: <span className="required">*</span>
            </label>
            <select
              name="release_version"
              value={formData.release_version}
              onChange={handleChange}
              required
            >
              <option value="">Select Release Version</option>
              {regions.map((region) => (
                <option key={region.id} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          {/* Product Selection */}
          <div className="form-group">
            <label>
              Product: <span className="required">*</span>
            </label>
            <select
              name="product"
              value={formData.product}
              onChange={handleChange}
              required
            >
              <option value="">Select Product</option>
              {availableProducts.map((product) => (
                <option key={product.id} value={product.name}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Environment Selection */}
          <div className="form-group">
            <label>
              Environment: <span className="required">*</span>
            </label>
            <select
              name="environment"
              value={formData.environment}
              onChange={handleChange}
              required
            >
              <option value="">Select Environment</option>
              {availableEnvironments.map((env) => (
                <option key={env.id} value={env.name}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>

          {/* Account Selection - Filtered by Product */}
          <div className="form-group">
            <label>
              Account Name: <span className="required">*</span>
            </label>
            <select
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              required
              disabled={!formData.product}
            >
              <option value="">
                {!formData.product
                  ? "Select a product first"
                  : `Select Account (${filteredAccounts.length} available)`}
              </option>
              {filteredAccounts.map((account) => (
                <option key={account.id} value={account.name}>
                  {account.name} ({account.region})
                </option>
              ))}
            </select>
            {formData.product && filteredAccounts.length === 0 && (
              <div className="validation-message">
                No accounts found with {formData.product} product. Please check
                account configurations.
              </div>
            )}
          </div>

          {/* Release Summary */}
          {/* {formData.product &&
            formData.environment &&
            formData.account_name && (
              <div className="release-summary">
                <h4>📋 Release Summary</h4>
                <div className="summary-content">
                  <div className="summary-item">
                    <span className="summary-label">Product:</span>
                    <span className="summary-value">{formData.product}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Environment:</span>
                    <span className="summary-value">
                      {getEnvironmentIcon(formData.environment)}{" "}
                      {formData.environment}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Account:</span>
                    <span className="summary-value">
                      🏢 {formData.account_name}
                    </span>
                  </div>
                </div>
              </div>
            )} */}

          {/* Planned Release Date */}
          <div className="form-group">
            <label>
              Planned Release Date: <span className="required">*</span>
            </label>
            <input
              type="date"
              name="release_date"
              value={formData.release_date}
              onChange={handleChange}
              required
            />
          </div>

          {/* Executor */}
          <div className="form-group">
            <label>
              Executor: <span className="required">*</span>
            </label>
            <input
              type="text"
              name="executor"
              value={formData.executor}
              onChange={handleChange}
              placeholder="Who will execute this release?"
              required
            />
          </div>

          {/* Status */}
          <div className="form-group">
            <label>Status:</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Scheduled">📅 Scheduled</option>
              <option value="In Progress">⚡ In Progress</option>
              <option value="Completed">✅ Completed</option>
              <option value="Blocked">🚫 Blocked</option>
            </select>
          </div>

          {/* Completion Details Section - Only show when status is Completed */}
          {isCompleted && (
            <div className="completion-section">
              <div className="section-header">
                <h3>✅ Completion Details</h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Actual Completion Date: <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    name="completion_date"
                    value={formData.completion_date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    Time Taken (Hours): <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    name="time_taken_hours"
                    value={formData.time_taken_hours}
                    onChange={handleChange}
                    placeholder="e.g., 4.5"
                    step="0.5"
                    min="0"
                    required
                  />
                </div>
              </div>

              {/* Defects Management Section */}
              {/* <div className="defects-section">
                <div className="defects-header">
                  <h4>🐛 Defects Tracking</h4>
                  <button
                    type="button"
                    className="btn btn-add-defect"
                    onClick={addDefect}
                  >
                    ➕ Add Defect
                  </button>
                </div>

                {defects.length === 0 ? (
                  <div className="no-defects">
                    <p>✅ No defects raised during this release</p>
                  </div>
                ) : (
                  <div className="defects-list">
                    {defects.map((defect, index) => (
                      <div key={defect.id} className="defect-item">
                        <div className="defect-header">
                          <span className="defect-number">
                            Defect #{index + 1}
                          </span>
                          <button
                            type="button"
                            className="btn btn-remove-defect"
                            onClick={() => removeDefect(defect.id)}
                            title="Remove Defect"
                          >
                            🗑️
                          </button>
                        </div>

                        <div className="defect-form">
                          <div className="defect-row">
                            <div className="defect-field">
                              <label>
                                Defect ID: <span className="required">*</span>
                              </label>
                              <input
                                type="text"
                                value={defect.defect_id}
                                onChange={(e) =>
                                  updateDefect(
                                    defect.id,
                                    "defect_id",
                                    e.target.value
                                  )
                                }
                                placeholder="e.g., ACMP-1234"
                                required
                              />
                            </div>

                            <div className="defect-field">
                              <label>Severity:</label>
                              <select
                                value={defect.severity}
                                onChange={(e) =>
                                  updateDefect(
                                    defect.id,
                                    "severity",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="Low">🟢 Low</option>
                                <option value="Medium">🟡 Medium</option>
                                <option value="High">🟠 High</option>
                                <option value="Critical">🔴 Critical</option>
                              </select>
                            </div>

                            <div className="defect-field">
                              <label>Status:</label>
                              <select
                                value={defect.status}
                                onChange={(e) =>
                                  updateDefect(
                                    defect.id,
                                    "status",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="Open">📂 Open</option>
                                <option value="In Progress">
                                  ⚡ In Progress
                                </option>
                                <option value="Fixed">✅ Fixed</option>
                                <option value="Closed">🔒 Closed</option>
                                <option value="Rejected">❌ Rejected</option>
                              </select>
                            </div>
                          </div>

                          <div className="defect-field">
                            <label>
                              Description: <span className="required">*</span>
                            </label>
                            <textarea
                              value={defect.description}
                              onChange={(e) =>
                                updateDefect(
                                  defect.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Describe the defect in detail..."
                              rows="2"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div> */}
              <div className="defects-section">
                <div className="defects-header">
                  {/* <img
                    src="https://deljira/s/-be2f6p/9120025/6jgoow/_/images/fav-jsw.png"
                    alt="Defect Icon"
                  /> */}
                  <h4>
                    {" "}
                    <img
                      src="https://deljira/s/-be2f6p/9120025/6jgoow/_/images/fav-jsw.png"
                      width="20px"
                      alt="Defect Icon"
                    />{" "}
                    Defects Tracking
                  </h4>
                  <button
                    type="button"
                    className="btn btn-add-defect"
                    onClick={addDefect}
                  >
                    ➕ Add Defect
                  </button>
                </div>

                {defects.length === 0 ? (
                  <div className="no-defects">
                    <p>✅ No defects raised during this release</p>
                  </div>
                ) : (
                  <div className="defects-list">
                    {defects.map((defect, index) => (
                      <div key={defect.id} className="defect-item">
                        <div className="defect-header">
                          <span className="defect-number">
                            Defect #{index + 1}
                          </span>
                          <button
                            type="button"
                            className="btn btn-remove-defect"
                            onClick={() => removeDefect(defect.id)}
                            title="Remove Defect"
                          >
                            🗑️
                          </button>
                        </div>

                        <div className="defect-form">
                          <div className="defect-row">
                            <div className="defect-field">
                              <label>
                                Defect ID: <span className="required">*</span>
                              </label>
                              <div className="defect-id-input">
                                <input
                                  type="text"
                                  value={defect.defect_id}
                                  onChange={(e) =>
                                    updateDefect(
                                      defect.id,
                                      "defect_id",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., ACMP-1234"
                                  required
                                />
                                {/* <button
                                  type="button"
                                  className="btn btn-generate-id"
                                  onClick={() =>
                                    updateDefect(
                                      defect.id,
                                      "defect_id",
                                      generateDefectId(formData.account_name)
                                    )
                                  }
                                  title="Generate ID"
                                  disabled={!formData.account_name}
                                >
                                  🎲
                                </button> */}
                              </div>
                            </div>

                            <div className="defect-field">
                              <label>Severity:</label>
                              <select
                                value={defect.severity}
                                onChange={(e) =>
                                  updateDefect(
                                    defect.id,
                                    "severity",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="Low">🟢 Low</option>
                                <option value="Medium">🟡 Medium</option>
                                <option value="High">🟠 High</option>
                                <option value="Critical">🔴 Critical</option>
                              </select>
                            </div>

                            <div className="defect-field">
                              <label>Status:</label>
                              <select
                                value={defect.status}
                                onChange={(e) =>
                                  updateDefect(
                                    defect.id,
                                    "status",
                                    e.target.value
                                  )
                                }
                              >
                                <option value="Open">📂 Open</option>
                                <option value="In Progress">
                                  ⚡ In Progress
                                </option>
                                <option value="Fixed">✅ Fixed</option>
                                <option value="Closed">🔒 Closed</option>
                                <option value="Rejected">❌ Rejected</option>
                              </select>
                            </div>
                          </div>

                          <div className="defect-field">
                            <label>
                              Description: <span className="required">*</span>
                            </label>
                            <textarea
                              value={defect.description}
                              onChange={(e) =>
                                updateDefect(
                                  defect.id,
                                  "description",
                                  e.target.value
                                )
                              }
                              placeholder="Describe the defect in detail..."
                              rows="2"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Completion Notes:</label>
                <textarea
                  name="completion_notes"
                  value={formData.completion_notes}
                  onChange={handleChange}
                  placeholder="Any additional notes about the completion (e.g., challenges faced, lessons learned)"
                  rows="3"
                />
              </div>
            </div>
          )}

          {/* Blocked Details Section - Only show when status is Blocked */}
          {isBlocked && (
            <div className="blocked-section">
              <div className="section-header">
                <h3>🚫 Blocking Details</h3>
              </div>

              <div className="form-group">
                <label>Blocking Reason:</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Describe why this release is blocked and what needs to be resolved"
                  rows="3"
                  required
                />
              </div>
            </div>
          )}

          {/* General Notes - Show for non-completed, non-blocked statuses */}
          {!isCompleted && !isBlocked && (
            <div className="form-group">
              <label>Notes:</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional notes or comments"
                rows="3"
              />
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {release ? "💾 Update" : "📅 Schedule"} Release
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              ❌ Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReleaseForm;
