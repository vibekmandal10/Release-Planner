import React, { useState } from "react";

const ReleaseTable = ({
  releases,
  regions,
  accounts,
  onEdit,
  onDelete,
  onFilter,
  readOnly = false,
}) => {
  const [filters, setFilters] = useState({
    release_version: "",
    account_region: "",
    status: "",
  });
  const [emailModal, setEmailModal] = useState({
    isOpen: false,
    release: null,
    emailAddress: "",
    isLoading: false,
  });
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailCcRecipients, setEmailCcRecipients] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");

  const getStatusClass = (status) => {
    switch (status) {
      case "Scheduled":
        return "status-scheduled";
      case "In Progress":
        return "status-in-progress";
      case "Done":
        return "status-done";
      case "Blocked":
        return "status-canceled";
      default:
        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Scheduled":
        return "📅";
      case "In Progress":
        return "⚡";
      case "Completed":
        return "✅";
      case "Blocked":
        return "🚫";
      default:
        return "❓";
    }
  };

  const handleFilterChange = (e) => {
    const newFilters = {
      ...filters,
      [e.target.name]: e.target.value,
    };
    setFilters(newFilters);

    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const clearFilters = () => {
    const emptyFilters = {
      release_version: "",
      account_region: "",
      status: "",
    };
    setFilters(emptyFilters);

    if (onFilter) {
      onFilter(emptyFilters);
    }
  };

  const getAccountRegion = (accountName) => {
    const account = accounts.find((acc) => acc.name === accountName);
    return account ? account.region : "";
  };

  const uniqueRegions = [...new Set(accounts.map((acc) => acc.region))].filter(
    Boolean
  );

  // Email functionality
  const openEmailModal = (release) => {
    setEmailModal({
      isOpen: true,
      release: release,
      emailAddress: "",
      isLoading: false,
    });

    // Pre-populate email subject and body
    const emailSubject = `Release Notification - ${release.release_version} for ${release.account_name}`;
    const emailBody = generateEmailBody(release);

    setEmailSubject(emailSubject);
    setEmailBody(emailBody);
  };

  const closeEmailModal = () => {
    setEmailModal({
      isOpen: false,
      release: null,
      emailAddress: "",
      isLoading: false,
    });
    setEmailRecipients("");
    setEmailCcRecipients("");
    setEmailSubject("");
    setEmailBody("");
  };

  const generateEmailBody = (release) => {
    const region = getAccountRegion(release.account_name);
    const releaseDate = new Date(release.release_date).toLocaleDateString();

    return `


Dear Operations Team,

Please find the release details below:

═══════════════════════════════════════
📋 RELEASE INFORMATION
═══════════════════════════════════════

🏷️  Release Version: ${release.release_version || "N/A"}
🏢  Account Name: ${release.account_name}
🌍  Region: ${region || "N/A"}
📅  Release Date: ${releaseDate}
👤  Executor: ${release.executor}
📊  Status: ${release.status}

═══════════════════════════════════════
📝 NOTES
═══════════════════════════════════════

${
  release.completion_notes
    ? `Completion Notes: ${release.completion_notes}`
    : release.notes
    ? `Notes: ${release.notes}`
    : "No additional notes provided."
}

═══════════════════════════════════════

Please ensure all necessary preparations are completed before the scheduled release date.

For any questions or concerns, please contact the release management team.

Best regards,
Release Management Team
    `.trim();
  };

  const sendEmail = async () => {
    if (!emailModal.emailAddress.trim()) {
      alert("Please enter an email address");
      return;
    }

    if (!emailModal.emailAddress.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }

    setEmailModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const emailBody = generateEmailBody(emailModal.release);

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: emailModal.emailAddress,
          subject: `Release Notification - ${emailModal.release.release_version} for ${emailModal.release.account_name}`,
          body: emailBody,
          releaseId: emailModal.release.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send email");
      }

      alert("Email sent successfully!");
      closeEmailModal();
    } catch (error) {
      console.error("Email send error:", error);
      alert(`Error sending email: ${error.message}`);
    } finally {
      setEmailModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const copyEmailToClipboard = () => {
    const emailBody = generateEmailBody(emailModal.release);
    navigator.clipboard
      .writeText(emailBody)
      .then(() => {
        alert("Email content copied to clipboard!");
      })
      .catch(() => {
        alert("Failed to copy to clipboard");
      });
  };

  const handleSendEmail = async () => {
    try {
      setEmailModal((prev) => ({ ...prev, isLoading: true }));

      // Parse recipients
      const parseRecipients = (recipients) => {
        if (!recipients || !recipients.trim()) return [];
        return recipients
          .split(";")
          .map((email) => email.trim())
          .filter((email) => email.length > 0);
      };

      const toRecipients = parseRecipients(emailRecipients);
      const ccRecipients = parseRecipients(emailCcRecipients);

      if (toRecipients.length === 0) {
        alert("Please enter at least one TO recipient");
        return;
      }

      const totalRecipients = toRecipients.length + ccRecipients.length;
      if (totalRecipients > 10) {
        alert("Maximum 10 total recipients allowed (TO + CC)");
        return;
      }

      // Prepare release data for the HTML template
      const releaseData = {
        id: emailModal.release.id,
        release_version: emailModal.release.release_version || "N/A",
        account_name: emailModal.release.account_name,
        region: getAccountRegion(emailModal.release.account_name) || "N/A",
        release_date: emailModal.release.release_date,
        executor: emailModal.release.executor,
        status: emailModal.release.status,
        notes: emailModal.release.notes || "",
        completion_notes: emailModal.release.completion_notes || "",
        completion_date: emailModal.release.completion_date || null,
        time_taken_hours: emailModal.release.time_taken_hours || null,
        defects_raised: emailModal.release.defects_raised || "0",
        defect_details: emailModal.release.defect_details || "",
        defects: emailModal.release.defects || [],
        created_at: emailModal.release.created_at,
        updated_at: emailModal.release.updated_at,
      };

      const emailData = {
        to: toRecipients,
        subject: emailSubject,
        releaseId: emailModal.release.id,
        releaseData: releaseData, // Send release data instead of body
        // body: emailBody, // Remove this - backend will generate from template
      };

      // Add CC if provided
      if (ccRecipients.length > 0) {
        emailData.cc = ccRecipients;
      }

      console.log("📧 Sending email with release data:", {
        recipients: {
          to: toRecipients.length,
          cc: ccRecipients.length,
        },
        releaseVersion: releaseData.release_version,
        account: releaseData.account_name,
        useTemplate: true,
      });

      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      const result = await response.json();

      if (result.success) {
        let message = `✅ Email sent successfully using ${result.templateUsed}!\n\n`;
        message += `TO (${
          result.recipientCount.to
        }): ${result.recipients.to.join(", ")}\n`;
        if (result.recipientCount.cc > 0) {
          message += `CC (${
            result.recipientCount.cc
          }): ${result.recipients.cc.join(", ")}\n`;
        }
        message += `\nTotal: ${result.recipientCount.total} recipients`;
        message += `\nTemplate: ${result.templateUsed}`;

        alert(message);
        closeEmailModal();
      } else {
        alert(`❌ Failed to send email: ${result.error}`);
      }
    } catch (error) {
      console.error("Email sending error:", error);
      alert(`❌ Error sending email: ${error.message}`);
    } finally {
      setEmailModal((prev) => ({ ...prev, isLoading: false }));
    }
  };

  return (
    <div className="table-container">
      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Release Version:</label>
            <select
              name="release_version"
              value={filters.release_version}
              onChange={handleFilterChange}
            >
              <option value="">All Versions</option>
              {regions.map((region) => (
                <option key={region.id} value={region.name}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Account Region:</label>
            <select
              name="account_region"
              value={filters.account_region}
              onChange={handleFilterChange}
            >
              <option value="">All Regions</option>
              {uniqueRegions.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Status:</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="Scheduled">📅 Scheduled</option>
              <option value="In Progress">⚡ In Progress</option>
              <option value="Completed">✅ Completed</option>
              <option value="Canceled">🚫 Blocked</option>
            </select>
          </div>

          <div className="filter-actions">
            <button onClick={clearFilters} className="btn btn-secondary btn-sm">
              🗑️ Clear Filters
            </button>
          </div>
        </div>
      </div>

      <table className="releases-table">
        <thead>
          <tr>
            <th>Release Version</th>
            <th>Account Name</th>
            <th>Region</th>
            <th>Release Date</th>
            <th>Executor</th>
            <th>Status</th>
            <th>Notes</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {releases.map((release) => (
            <tr key={release.id}>
              <td className="release-version">
                <span className="version-badge">
                  🏷️ {release.release_version || "N/A"}
                </span>
              </td>
              <td className="account-name">
                <strong>{release.account_name}</strong>
              </td>
              <td className="region-info">
                {getAccountRegion(release.account_name)}
              </td>
              <td>{new Date(release.release_date).toLocaleDateString()}</td>
              <td>👤 {release.executor}</td>
              <td>
                <span
                  className={`status-badge ${getStatusClass(release.status)}`}
                >
                  {getStatusIcon(release.status)} {release.status}
                </span>
              </td>
              <td className="notes-cell">
                {release.completion_notes
                  ? `  ${release.completion_notes} `
                  : `${release.notes}`}
              </td>
              <td className="actions-cell">
                <button
                  className="btn btn-sm btn-email"
                  onClick={() => openEmailModal(release)}
                  title="Send Email to Operations"
                >
                  📧 Email
                </button>
                {!readOnly && (
                  <>
                    <button
                      className="btn btn-sm btn-edit"
                      onClick={() => onEdit(release)}
                      title="Edit Release"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="btn btn-sm btn-delete"
                      onClick={() => onDelete(release.id)}
                      title="Delete Release"
                    >
                      🗑️ Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Email Modal */}
      {emailModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content email-modal">
            <div className="modal-header">
              {/* <h3>📧 Send Release Details to Operations</h3>
              <button className="modal-close" onClick={closeEmailModal}>
                ❌
              </button> */}
            </div>

            <div className="modal-body">
              <div className="release-summary">
                <h4>📋 Release Summary</h4>
                <div className="summary-grid">
                  <div>
                    <strong>Version:</strong>{" "}
                    {emailModal.release?.release_version}
                  </div>
                  <div>
                    <strong>Account:</strong> {emailModal.release?.account_name}
                  </div>
                  <div>
                    <strong>Region:</strong>{" "}
                    {getAccountRegion(emailModal.release?.account_name)}
                  </div>
                  <div>
                    <strong>Date:</strong>{" "}
                    {new Date(
                      emailModal.release?.release_date
                    ).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Executor:</strong> {emailModal.release?.executor}
                  </div>
                  <div>
                    <strong>Status:</strong> {emailModal.release?.status}
                  </div>
                </div>
              </div>

              <div className="email-form">
                <div className="form-group">
                  <label htmlFor="emailRecipients">
                    📧 TO Recipients: <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="emailRecipients"
                    value={emailRecipients}
                    onChange={(e) => setEmailRecipients(e.target.value)}
                    placeholder="operations-team@amdocs.com; application-team2@amdocs.com"
                    className="email-recipients"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emailCcRecipients">📋 CC Recipients:</label>
                  <input
                    type="text"
                    id="emailCcRecipients"
                    value={emailCcRecipients}
                    onChange={(e) => setEmailCcRecipients(e.target.value)}
                    placeholder="manager1@amdocs.com; manager2@amdocs.com"
                    className="email-recipients"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emailSubject">
                    📝 Subject: <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="emailSubject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                    className="email-subject"
                    required
                  />
                </div>

                <div className="email-preview">
                  <label htmlFor="emailBody">
                    📄 Message: <span className="required">*</span>
                  </label>
                  <textarea
                    id="emailBody"
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Email message content"
                    rows="12"
                    className="email-body"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={closeEmailModal}
                disabled={emailModal.isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSendEmail}
                disabled={
                  emailModal.isLoading ||
                  !emailRecipients.trim() ||
                  !emailSubject.trim() ||
                  !emailBody.trim()
                }
              >
                {emailModal.isLoading ? "📤 Sending..." : "📧 Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {releases.length === 0 && (
        <div className="empty-state">
          <p>📋 No releases found matching the current filters.</p>
          {Object.values(filters).some((filter) => filter) && (
            <button onClick={clearFilters} className="btn btn-secondary">
              🗑️ Clear Filters to Show All
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReleaseTable;
