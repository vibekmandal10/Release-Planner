import React, { useState, useEffect } from "react";

const ReleaseForm = ({ accounts, regions, release, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    account_name: "",
    release_date: "",
    executor: "",
    status: "Scheduled",
    notes: "",
    release_version: "",
  });

  useEffect(() => {
    if (release) {
      setFormData({
        account_name: release.account_name,
        release_date: release.release_date,
        executor: release.executor,
        status: release.status,
        notes: release.notes || "",
        release_version: release.release_version || "",
      });
    }
  }, [release]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>{release ? "✏️ Edit Release" : "➕ Schedule New Release"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Release Version:</label>
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

          <div className="form-group">
            <label>Account Name:</label>
            <select
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              required
            >
              <option value="">Select Account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.name}>
                  {account.name} ({account.region})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Release Date:</label>
            <input
              type="date"
              name="release_date"
              value={formData.release_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Executor:</label>
            <input
              type="text"
              name="executor"
              value={formData.executor}
              onChange={handleChange}
              placeholder="Who will execute this release?"
              required
            />
          </div>

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
