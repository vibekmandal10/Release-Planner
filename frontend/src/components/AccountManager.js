import React, { useState } from "react";

const AccountManager = ({ accounts, onDataUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    products: [], // Changed back to products array
  });
  const [filterRegion, setFilterRegion] = useState("");

  const regions = ["APAC", "CALA", "EMEA", "Cluster M", "Cluster R"];
  const products = ["Monitoring", "SRE"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingAccount
        ? `/api/accounts/${editingAccount.id}`
        : "/api/accounts";
      const method = editingAccount ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save account");
      }

      await onDataUpdate();
      setShowForm(false);
      setEditingAccount(null);
      setFormData({ name: "", region: "", products: [] });
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      region: account.region,
      products: account.products || [],
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        const response = await fetch(`/api/accounts/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete account");
        }

        await onDataUpdate();
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
    setFormData({ name: "", region: "", products: [] });
  };

  const filteredAccounts = filterRegion
    ? accounts.filter((acc) => acc.region === filterRegion)
    : accounts;

  const getRegionStats = () => {
    return regions.map((region) => ({
      name: region,
      count: accounts.filter((acc) => acc.region === region).length,
    }));
  };

  return (
    <div className="account-manager">
      <div className="section-header">
        <h3>🏢 Accounts & Regions Management</h3>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Add New Account
        </button>
      </div>

      {/* Region Statistics */}
      <div className="region-stats">
        <h4>📊 Accounts by Region</h4>
        <div className="stats-grid">
          {getRegionStats().map((stat) => (
            <div key={stat.name} className="stat-item">
              <span className="stat-label">{stat.name}</span>
              <span className="stat-count">{stat.count} accounts</span>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="form-card">
          <h4>{editingAccount ? "✏️ Edit Account" : "➕ Add New Account"}</h4>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Account Name:</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., VODAFONE_DE"
                required
              />
            </div>
            <div className="form-group">
              <label>Region:</label>
              <select
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
                required
              >
                <option value="">Select Region</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Products:</label>
              <div className="checkbox-group horizontal">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.products?.includes("Monitoring") || false}
                    onChange={(e) => {
                      const products = formData.products || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          products: [...products, "Monitoring"],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          products: products.filter((p) => p !== "Monitoring"),
                        });
                      }
                    }}
                  />
                  Monitoring
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.products?.includes("SRE") || false}
                    onChange={(e) => {
                      const products = formData.products || [];
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          products: [...products, "SRE"],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          products: products.filter((p) => p !== "SRE"),
                        });
                      }
                    }}
                  />
                  SRE
                </label>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingAccount ? "💾 Update" : "➕ Add"} Account
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

      {/* Filter */}
      <div className="filter-section">
        <label>Filter by Region:</label>
        <select
          value={filterRegion}
          onChange={(e) => setFilterRegion(e.target.value)}
        >
          <option value="">All Regions</option>
          {regions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </div>

      {/* Accounts List */}
      <div className="accounts-list">
        <h4>📋 Accounts ({filteredAccounts.length})</h4>
        <div className="accounts-table">
          <table>
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Region</th>
                <th>Products</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id}>
                  <td>
                    <strong>{account.name}</strong>
                  </td>
                  <td>{account.region}</td>
                  <td>{account.products?.join(", ") || "-"}</td>
                  <td>{new Date(account.created_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => handleEdit(account)}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => handleDelete(account.id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountManager;
