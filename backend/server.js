const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");

// Add these email configuration constants after the existing constants
const nodemailer = require("nodemailer");

// Email configuration
const SMTP_CONFIG = {
  host: "umg.corp.amdocs.com",
  port: 25,
  secure: false, // true for 465, false for other ports
  auth: null, // No authentication required for internal SMTP
  tls: {
    rejectUnauthorized: false, // Accept self-signed certificates
  },
};

const EMAIL_SETTINGS = {
  fromEmail: "release-management@amdocs.com",
  fromName: "Release Management System",
  maxRecipients: 50,
  allowedDomains: ["amdocs.com", "gmail.com", "outlook.com", "yahoo.com"], // Add your allowed domains
};

// Build Outlook-compatible HTML email template with better structure
const buildReleaseEmailTemplate = (release) => {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Release Notification</title>
    <!--[if mso]>
    <style type="text/css">
        table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
        td { mso-line-height-rule: exactly; }
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, Helvetica, sans-serif; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
    
    <!-- Wrapper Table -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f5f5f5; min-height: 100vh;">
        <tr>
            <td align="center" valign="top" style="padding: 20px;">
                
                <!-- Main Email Container -->
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border: 2px solid #0078d7; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    
                    <!-- Header Section -->
                    <tr>
                        <td style="background-color: #0078d7; padding: 25px; text-align: center; border-radius: 6px 6px 0 0;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold; font-family: Arial, Helvetica, sans-serif;">
                                🚀 RELEASE NOTIFICATION
                            </h1>
                            <h2 style="margin: 10px 0 0 0; color: #ffffff; font-size: 18px; font-weight: normal; font-family: Arial, Helvetica, sans-serif;">
                                ${release.release_version}
                            </h2>
                        </td>
                    </tr>
                    
                    <!-- Content Section -->
                    <tr>
                        <td style="padding: 30px; background-color: #ffffff;">
                            
                            <!-- Greeting -->
                            <p style="margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #333333; line-height: 1.6;">
                                Dear <strong>Operations Team</strong>,
                            </p>
                            
                            <p style="margin: 0 0 25px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #333333; line-height: 1.6;">
                                Please find the release details below:
                            </p>
                            
                            <!-- Release Details Table -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border: 2px solid #0078d7; border-collapse: collapse; margin-bottom: 25px;">
                                
                                <!-- Table Header -->
                                <tr>
                                    <td colspan="2" style="background-color: #0078d7; color: #ffffff; font-weight: bold; text-align: center; font-size: 16px; padding: 15px; font-family: Arial, Helvetica, sans-serif; border: none;">
                                        📋 RELEASE DETAILS
                                    </td>
                                </tr>
                                
                                <!-- Release Version Row -->
                                <tr>
                                    <td style="background-color: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; width: 40%;">
                                        🏷️ Release Version
                                    </td>
                                    <td style="border: 1px solid #dee2e6; color: #0078d7; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold;">
                                        ${release.release_version}
                                    </td>
                                </tr>
                                
                                <!-- Account Name Row -->
                                <tr>
                                    <td style="background-color: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
                                        🏢 Account Name
                                    </td>
                                    <td style="border: 1px solid #dee2e6; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
                                        ${release.account_name}
                                    </td>
                                </tr>
                                
                                <!-- Region Row -->
                                <tr>
                                    <td style="background-color: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
                                        🌍 Region
                                    </td>
                                    <td style="border: 1px solid #dee2e6; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
                                        ${release.region || "Not Specified"}
                                    </td>
                                </tr>
                                
                                <!-- Release Date Row -->
                                <tr>
                                    <td style="background-color: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
                                        📅 Release Date
                                    </td>
                                    <td style="border: 1px solid #dee2e6; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold;">
                                        ${new Date(
                                          release.release_date
                                        ).toLocaleDateString("en-US", {
                                          weekday: "long",
                                          year: "numeric",
                                          month: "long",
                                          day: "numeric",
                                        })}
                                    </td>
                                </tr>
                                
                                <!-- Executor Row -->
                                <tr>
                                    <td style="background-color: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
                                        👤 Executor
                                    </td>
                                    <td style="border: 1px solid #dee2e6; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
                                        ${release.executor}
                                    </td>
                                </tr>
                                
                                <!-- Status Row -->
                                <tr>
                                    <td style="background-color: #f8f9fa; border: 1px solid #dee2e6; font-weight: bold; color: #333333; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px;">
                                        📊 Status
                                    </td>
                                    <td style="border: 1px solid #dee2e6; padding: 12px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; font-weight: bold; color: ${
                                      release.status === "Blocked"
                                        ? "#dc3545"
                                        : release.status === "Completed"
                                        ? "#28a745"
                                        : release.status === "In Progress"
                                        ? "#ffc107"
                                        : "#0078d7"
                                    };">
                                        ${release.status.toUpperCase()}
                                    </td>
                                </tr>
                                
                            </table>
                            
                            ${
                              release.notes
                                ? `
                            <!-- Notes Section -->
                            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 25px;">
                                <tr>
                                    <td style="background-color: #e9ecef; padding: 15px; border-left: 4px solid #0078d7; border-radius: 4px;">
                                        <h3 style="margin: 0 0 10px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; font-weight: bold; color: #0078d7;">
                                            📝 NOTES
                                        </h3>
                                        <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333333; line-height: 1.6; white-space: pre-wrap;">
                                            ${release.notes}
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            `
                                : ""
                            }
                            
                            <!-- Action Items -->
                            <p style="margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #333333; line-height: 1.6;">
                                ✅ Please ensure all necessary preparations are completed before the scheduled release date.
                            </p>
                            
                            <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 16px; color: #333333; line-height: 1.6;">
                                For any questions or concerns, please contact the <strong>Release Management Team</strong>.
                            </p>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer Section -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; border-radius: 0 0 6px 6px;">
                            <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #666666;">
                                📧 Release Management System | Confidential
                            </p>
                            <p style="margin: 5px 0 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #666666;">
                                Generated on ${new Date().toLocaleString()}
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>`;
};

// Build a plain text version of the release email
const buildPlainTextReleaseEmail = (release) => {
  return `RELEASE NOTIFICATION - ${release.release_version}

Dear Operations Team,

Please find the release details below:

==============================================
RELEASE DETAILS
==============================================

🏷️ Release Version: ${release.release_version}
🏢 Account Name: ${release.account_name}
🌍 Region: ${release.region || "Not Specified"}
📅 Release Date: ${new Date(release.release_date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
👤 Executor: ${release.executor}
📊 Status: ${release.status.toUpperCase()}

${
  release.notes
    ? `📝 NOTES:
${release.notes}

`
    : ""
}✅ Please ensure all necessary preparations are completed before the scheduled release date.

For any questions or concerns, please contact the Release Management Team.

==============================================
📧 Release Management System | Confidential
Generated on ${new Date().toLocaleString()}
==============================================`;
};

// Email helper functions
const createEmailTransporter = () => {
  try {
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    // Verify connection configuration
    transporter.verify((error, success) => {
      if (error) {
        console.log("SMTP connection error:", error);
      } else {
        console.log("SMTP server is ready to take our messages");
      }
    });

    return transporter;
  } catch (error) {
    console.error("Failed to create email transporter:", error);
    throw error;
  }
};

const validateEmailAddresses = (emails) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validEmails = [];
  const errors = [];

  // Convert to array if string
  const emailArray = Array.isArray(emails) ? emails : [emails];

  emailArray.forEach((email) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      errors.push("Empty email address found");
      return;
    }

    if (!emailRegex.test(trimmedEmail)) {
      errors.push(`Invalid email format: ${trimmedEmail}`);
      return;
    }

    // Check domain if restrictions are enabled
    const domain = trimmedEmail.split("@")[1].toLowerCase();
    if (
      EMAIL_SETTINGS.allowedDomains.length > 0 &&
      !EMAIL_SETTINGS.allowedDomains.includes(domain)
    ) {
      errors.push(`Domain not allowed: ${domain} (${trimmedEmail})`);
      return;
    }

    validEmails.push(trimmedEmail);
  });

  return { validEmails, errors };
};

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// File paths
const DATA_DIR = path.join(__dirname, "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const RELEASES_FILE = path.join(DATA_DIR, "releases.json");
const AVAILABLE_RELEASES_FILE = path.join(DATA_DIR, "available_releases.json"); // Use available_releases.json

// Ensure data directory exists
const ensureDataDir = async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
};

// Initialize data files
const initializeData = async () => {
  await ensureDataDir();

  // Initialize empty available_releases file
  try {
    await fs.access(AVAILABLE_RELEASES_FILE);
  } catch {
    await fs.writeFile(AVAILABLE_RELEASES_FILE, JSON.stringify([], null, 2));
  }

  // Initialize empty accounts file
  try {
    await fs.access(ACCOUNTS_FILE);
  } catch {
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify([], null, 2));
  }

  // Initialize empty releases file
  try {
    await fs.access(RELEASES_FILE);
  } catch {
    await fs.writeFile(RELEASES_FILE, JSON.stringify([], null, 2));
  }
};

// Helper functions
const readAccounts = async () => {
  try {
    const data = await fs.readFile(ACCOUNTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading accounts:", err);
    return [];
  }
};

const writeAccounts = async (accounts) => {
  try {
    await fs.writeFile(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  } catch (err) {
    console.error("Error writing accounts:", err);
  }
};

const readReleases = async () => {
  try {
    const data = await fs.readFile(RELEASES_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading releases:", err);
    return [];
  }
};

const writeReleases = async (releases) => {
  try {
    await fs.writeFile(RELEASES_FILE, JSON.stringify(releases, null, 2));
  } catch (err) {
    console.error("Error writing releases:", err);
  }
};

const readAvailableReleases = async () => {
  try {
    const data = await fs.readFile(AVAILABLE_RELEASES_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading available releases:", err);
    return [];
  }
};

const writeAvailableReleases = async (availableReleases) => {
  try {
    await fs.writeFile(
      AVAILABLE_RELEASES_FILE,
      JSON.stringify(availableReleases, null, 2)
    );
  } catch (err) {
    console.error("Error writing available releases:", err);
  }
};

// Add this function to migrate existing releases
const migrateReleases = async () => {
  try {
    const releases = await readReleases();
    let needsUpdate = false;

    const updatedReleases = releases.map((release) => {
      // Check if release needs migration (missing new fields)
      if (!release.hasOwnProperty("completion_date")) {
        needsUpdate = true;
        return {
          ...release,
          completion_date: null,
          time_taken_hours: null,
          defects_raised: "0",
          defect_details: release.defect_details || "",
          completion_notes: "",
          defects: [],
        };
      }
      return release;
    });

    if (needsUpdate) {
      await writeReleases(updatedReleases);
      console.log("Releases migrated successfully");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }
};

// Routes

// Get all available release versions
app.get("/api/regions", async (req, res) => {
  try {
    const availableReleases = await readAvailableReleases();
    res.json(availableReleases.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new release version - UPDATED to support features
app.post("/api/regions", async (req, res) => {
  try {
    const { name, description, features = [] } = req.body; // Added features parameter
    const availableReleases = await readAvailableReleases();

    // Check if release version already exists
    if (
      availableReleases.find(
        (release) => release.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      return res.status(400).json({ error: "Release version already exists" });
    }

    const newId = Math.max(...availableReleases.map((r) => r.id), 0) + 1;

    // Process features to ensure they have proper IDs
    const processedFeatures = features.map((feature, index) => ({
      id: feature.id || Date.now() + index,
      name: feature.name,
      description: feature.description,
    }));

    const newRelease = {
      id: newId,
      name: name.toUpperCase(),
      description: description || "",
      features: processedFeatures, // Added features
      created_at: new Date().toISOString(),
    };
    availableReleases.push(newRelease);
    await writeAvailableReleases(availableReleases);
    res.json(newRelease);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update release version - UPDATED to support features
app.put("/api/regions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, features = [] } = req.body; // Added features parameter
    const availableReleases = await readAvailableReleases();
    const index = availableReleases.findIndex((r) => r.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ error: "Release version not found" });
    }

    // Check if name already exists (excluding current release)
    if (
      availableReleases.find(
        (release) =>
          release.name.toLowerCase() === name.toLowerCase() &&
          release.id !== parseInt(id)
      )
    ) {
      return res
        .status(400)
        .json({ error: "Release version name already exists" });
    }

    // Process features to ensure they have proper IDs
    const processedFeatures = features.map((feature, index) => ({
      id: feature.id || Date.now() + index,
      name: feature.name,
      description: feature.description,
    }));

    availableReleases[index] = {
      ...availableReleases[index],
      name: name.toUpperCase(),
      description: description || "",
      features: processedFeatures, // Added features
      updated_at: new Date().toISOString(),
    };

    await writeAvailableReleases(availableReleases);
    res.json({ message: "Release version updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete release version
app.delete("/api/regions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const availableReleases = await readAvailableReleases();
    const releases = await readReleases();

    // Check if release version is being used in any releases
    const releaseInUse = releases.some(
      (release) =>
        release.release_version ===
        availableReleases.find((r) => r.id === parseInt(id))?.name
    );
    if (releaseInUse) {
      return res.status(400).json({
        error: "Cannot delete release version that is being used in releases",
      });
    }

    const filteredReleases = availableReleases.filter(
      (r) => r.id !== parseInt(id)
    );
    await writeAvailableReleases(filteredReleases);
    res.json({ message: "Release version deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all accounts
app.get("/api/accounts", async (req, res) => {
  try {
    const accounts = await readAccounts();
    res.json(accounts.sort((a, b) => a.name.localeCompare(b.name)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new account
app.post("/api/accounts", async (req, res) => {
  try {
    const { name, region } = req.body;
    const accounts = await readAccounts();

    // Check if account already exists
    if (accounts.find((acc) => acc.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: "Account already exists" });
    }

    const newId = Math.max(...accounts.map((a) => a.id), 0) + 1;
    const newAccount = {
      id: newId,
      name: name.toUpperCase(),
      region: region || "",
      created_at: new Date().toISOString(),
    };
    accounts.push(newAccount);
    await writeAccounts(accounts);
    res.json(newAccount);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update account
app.put("/api/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, region } = req.body;
    const accounts = await readAccounts();
    const index = accounts.findIndex((a) => a.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ error: "Account not found" });
    }

    // Check if name already exists (excluding current account)
    if (
      accounts.find(
        (acc) =>
          acc.name.toLowerCase() === name.toLowerCase() &&
          acc.id !== parseInt(id)
      )
    ) {
      return res.status(400).json({ error: "Account name already exists" });
    }

    accounts[index] = {
      ...accounts[index],
      name: name.toUpperCase(),
      region: region || "",
      updated_at: new Date().toISOString(),
    };

    await writeAccounts(accounts);
    res.json({ message: "Account updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete account
app.delete("/api/accounts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const accounts = await readAccounts();
    const releases = await readReleases();

    // Check if account is being used in any releases
    const accountInUse = releases.some(
      (release) =>
        release.account_name ===
        accounts.find((a) => a.id === parseInt(id))?.name
    );
    if (accountInUse) {
      return res.status(400).json({
        error: "Cannot delete account that is being used in releases",
      });
    }

    const filteredAccounts = accounts.filter((a) => a.id !== parseInt(id));
    await writeAccounts(filteredAccounts);
    res.json({ message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all releases with optional filtering
app.get("/api/releases", async (req, res) => {
  try {
    const releases = await readReleases();
    const { release_version, account_region, status } = req.query;

    let filteredReleases = releases;

    // Filter by release version
    if (release_version) {
      filteredReleases = filteredReleases.filter(
        (r) => r.release_version === release_version
      );
    }

    // Filter by account region
    if (account_region) {
      const accounts = await readAccounts();
      const accountsInRegion = accounts
        .filter((acc) => acc.region === account_region)
        .map((acc) => acc.name);
      filteredReleases = filteredReleases.filter((r) =>
        accountsInRegion.includes(r.account_name)
      );
    }

    // Filter by status
    if (status) {
      filteredReleases = filteredReleases.filter((r) => r.status === status);
    }

    res.json(
      filteredReleases.sort(
        (a, b) => new Date(b.release_date) - new Date(a.release_date)
      )
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the POST endpoint for creating releases
app.post("/api/releases", async (req, res) => {
  try {
    const {
      account_name,
      release_date,
      executor,
      status,
      notes,
      release_version,
      // Add new completion tracking fields
      completion_date,
      time_taken_hours,
      defects_raised,
      defect_details,
      completion_notes,
      defects, // New defects array
    } = req.body;

    const releases = await readReleases();
    const newId = Math.max(...releases.map((r) => r.id), 0) + 1;

    const newRelease = {
      id: newId,
      account_name,
      release_date,
      executor,
      status: status || "Scheduled",
      notes: notes || "",
      release_version: release_version || "",
      // Add new fields
      completion_date: completion_date || null,
      time_taken_hours: time_taken_hours || null,
      defects_raised: defects_raised || "0",
      defect_details: defect_details || "",
      completion_notes: completion_notes || "",
      defects: defects || [], // Store defects array
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    releases.push(newRelease);
    await writeReleases(releases);
    res.json(newRelease);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update the PUT endpoint for updating releases
app.put("/api/releases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      account_name,
      release_date,
      executor,
      status,
      notes,
      release_version,
      // Add new completion tracking fields
      completion_date,
      time_taken_hours,
      defects_raised,
      defect_details,
      completion_notes,
      defects, // New defects array
    } = req.body;

    const releases = await readReleases();
    const index = releases.findIndex((r) => r.id === parseInt(id));

    if (index === -1) {
      return res.status(404).json({ error: "Release not found" });
    }

    releases[index] = {
      ...releases[index],
      account_name,
      release_date,
      executor,
      status,
      notes: notes || "",
      release_version: release_version || "",
      // Update new fields
      completion_date: completion_date || null,
      time_taken_hours: time_taken_hours || null,
      defects_raised: defects_raised || "0",
      defect_details: defect_details || "",
      completion_notes: completion_notes || "",
      defects: defects || [], // Update defects array
      updated_at: new Date().toISOString(),
    };

    await writeReleases(releases);
    res.json({
      message: "Release updated successfully",
      release: releases[index],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete release
app.delete("/api/releases/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const releases = await readReleases();
    const filteredReleases = releases.filter((r) => r.id !== parseInt(id));
    await writeReleases(filteredReleases);
    res.json({ message: "Release deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get release statistics - UPDATED to include features count
app.get("/api/stats", async (req, res) => {
  try {
    const releases = await readReleases();
    const accounts = await readAccounts();
    const availableReleases = await readAvailableReleases();

    const stats = {
      totalAccounts: accounts.length,
      totalReleases: releases.length,
      totalRegions: availableReleases.length,
      totalFeatures: availableReleases.reduce(
        (sum, region) => sum + (region.features?.length || 0),
        0
      ), // Added features count
      statusCounts: releases.reduce((acc, release) => {
        acc[release.status] = (acc[release.status] || 0) + 1;
        return acc;
      }, {}),
      releaseVersionCounts: releases.reduce((acc, release) => {
        if (release.release_version) {
          acc[release.release_version] =
            (acc[release.release_version] || 0) + 1;
        }
        return acc;
      }, {}),
      regionCounts: accounts.reduce((acc, account) => {
        if (account.region) {
          acc[account.region] = (acc[account.region] || 0) + 1;
        }
        return acc;
      }, {}),
      upcomingReleases: releases.filter(
        (r) =>
          new Date(r.release_date) >= new Date() && r.status === "Scheduled"
      ).length,
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Function to send email to multiple recipients with CC support
const sendEmail = async (
  recipients,
  subject,
  body,
  releaseId = null,
  ccRecipients = null,
  bccRecipients = null,
  releaseData = null
) => {
  let transporter = null;

  try {
    transporter = createEmailTransporter();

    // Validate TO recipients
    const { validEmails: validToEmails, errors: toErrors } =
      validateEmailAddresses(recipients);

    // Validate CC recipients if provided
    let validCcEmails = [];
    let ccErrors = [];
    if (ccRecipients && ccRecipients.length > 0) {
      const ccValidation = validateEmailAddresses(ccRecipients);
      validCcEmails = ccValidation.validEmails;
      ccErrors = ccValidation.errors.map((err) => `CC: ${err}`);
    }

    // Validate BCC recipients if provided
    let validBccEmails = [];
    let bccErrors = [];
    if (bccRecipients && bccRecipients.length > 0) {
      const bccValidation = validateEmailAddresses(bccRecipients);
      validBccEmails = bccValidation.validEmails;
      bccErrors = bccValidation.errors.map((err) => `BCC: ${err}`);
    }

    // Combine all errors
    const allErrors = [...toErrors, ...ccErrors, ...bccErrors];
    if (allErrors.length > 0) {
      throw new Error(`Email validation failed: ${allErrors.join("; ")}`);
    }

    // Check total recipient count
    const totalRecipients =
      validToEmails.length + validCcEmails.length + validBccEmails.length;
    if (totalRecipients === 0) {
      throw new Error("No valid recipients found");
    }

    if (totalRecipients > EMAIL_SETTINGS.maxRecipients) {
      throw new Error(
        `Total recipients (${totalRecipients}) exceeds maximum allowed (${EMAIL_SETTINGS.maxRecipients})`
      );
    }

    // Email options optimized for Outlook
    const mailOptions = {
      from: `"${EMAIL_SETTINGS.fromName}" <${EMAIL_SETTINGS.fromEmail}>`,
      to: validToEmails.join(", "),
      subject: subject,
      headers: {
        "X-Release-ID": releaseId || "unknown",
        "X-Mailer": "Release Management System v1.0",
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
        "MIME-Version": "1.0",
      },
    };

    // Set content based on whether we have release data
    if (releaseData) {
      // Use the professional HTML template for release notifications
      mailOptions.html = buildReleaseEmailTemplate(releaseData);
      mailOptions.text = buildPlainTextReleaseEmail(releaseData);
      console.log("Using release template for email content");
    } else {
      // For regular emails, use the body as plain text and create simple HTML
      mailOptions.text = body;
      mailOptions.html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Email</title>
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, Helvetica, sans-serif; font-size: 14px; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <tr>
            <td>
                <pre style="font-family: Arial, Helvetica, sans-serif; white-space: pre-wrap; word-wrap: break-word; margin: 0; font-size: 14px; line-height: 1.6;">${body}</pre>
            </td>
        </tr>
    </table>
</body>
</html>`;
      console.log("Using simple HTML wrapper for email content");
    }

    // Add CC if provided
    if (validCcEmails.length > 0) {
      mailOptions.cc = validCcEmails.join(", ");
    }

    // Add BCC if provided
    if (validBccEmails.length > 0) {
      mailOptions.bcc = validBccEmails.join(", ");
    }

    console.log(
      `Sending Outlook-compatible email to ${totalRecipients} total recipients:`
    );
    console.log(`TO (${validToEmails.length}): ${validToEmails.join(", ")}`);
    if (validCcEmails.length > 0) {
      console.log(`CC (${validCcEmails.length}): ${validCcEmails.join(", ")}`);
    }
    if (validBccEmails.length > 0) {
      console.log(
        `BCC (${validBccEmails.length}): ${validBccEmails.join(", ")}`
      );
    }
    console.log(`Subject: ${subject}`);
    console.log(
      `Content Type: ${releaseData ? "Release Template" : "Simple HTML"}`
    );

    // Send email
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent successfully");
    console.log("Message ID:", info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      recipients: {
        to: validToEmails,
        cc: validCcEmails,
        bcc: validBccEmails,
      },
      recipientCount: {
        to: validToEmails.length,
        cc: validCcEmails.length,
        bcc: validBccEmails.length,
        total: totalRecipients,
      },
    };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  } finally {
    if (transporter) {
      transporter.close();
    }
  }
};

// Email sending endpoint with CC/BCC support and template
app.post("/api/send-email", async (req, res) => {
  try {
    const { to, cc, bcc, subject, body, releaseId, useTemplate, releaseData } =
      req.body;

    // Validate input
    if (!to || !subject || !body) {
      return res.status(400).json({
        error: "Missing required email fields",
        required: ["to", "subject", "body"],
        optional: ["cc", "bcc", "releaseId", "useTemplate", "releaseData"],
      });
    }

    // Helper function to parse recipients
    const parseRecipients = (recipients) => {
      if (!recipients) return [];
      if (typeof recipients === "string") {
        return recipients
          .split(/[,;\n]/)
          .map((email) => email.trim())
          .filter((email) => email.length > 0);
      } else if (Array.isArray(recipients)) {
        return recipients;
      }
      return [];
    };

    // Parse all recipient types
    const toRecipients = parseRecipients(to);
    const ccRecipients = parseRecipients(cc);
    const bccRecipients = parseRecipients(bcc);

    if (toRecipients.length === 0) {
      return res.status(400).json({
        error: "At least one TO recipient is required",
      });
    }

    console.log(`Processing email request:`);
    console.log(`TO: ${toRecipients.length} recipients`);
    console.log(`CC: ${ccRecipients.length} recipients`);
    console.log(`BCC: ${bccRecipients.length} recipients`);
    console.log(
      `Template: ${useTemplate && releaseData ? "Enabled" : "Disabled"}`
    );

    // Send email with or without template
    const result = await sendEmail(
      toRecipients,
      subject,
      body,
      releaseId,
      ccRecipients,
      bccRecipients,
      useTemplate && releaseData ? releaseData : null
    );

    // Log the email activity
    const emailLog = {
      timestamp: new Date().toISOString(),
      recipients: result.recipients,
      recipientCount: result.recipientCount,
      subject: subject,
      releaseId: releaseId,
      template: useTemplate && releaseData ? "HTML" : "Plain Text",
      status: "sent",
      method: "nodemailer-smtp-with-cc-bcc",
      smtpServer: SMTP_CONFIG.host,
      port: SMTP_CONFIG.port,
      messageId: result.messageId,
      platform: process.platform,
    };

    console.log("Email log:", emailLog);

    res.json({
      success: true,
      message: `Email sent successfully to ${result.recipientCount.total} total recipients (${result.recipientCount.to} TO, ${result.recipientCount.cc} CC, ${result.recipientCount.bcc} BCC)`,
      emailLog: emailLog,
      messageId: result.messageId,
      recipients: result.recipients,
      recipientCount: result.recipientCount,
    });
  } catch (error) {
    console.error("❌ Error sending email:", error);

    // Handle specific SMTP errors
    let errorMessage = "Failed to send email";
    let statusCode = 500;

    if (error.message.includes("Email validation failed")) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (
      error.message.includes("Total recipients") &&
      error.message.includes("exceeds maximum")
    ) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.code === "ECONNREFUSED") {
      errorMessage =
        "Cannot connect to SMTP server umg.corp.amdocs.com:25. Please check network connectivity.";
      statusCode = 503;
    } else if (error.code === "ETIMEDOUT") {
      errorMessage =
        "SMTP connection timed out. Please check network connectivity.";
      statusCode = 504;
    } else if (error.code === "ENOTFOUND") {
      errorMessage =
        "SMTP server umg.corp.amdocs.com not found. Please check DNS resolution.";
      statusCode = 503;
    } else if (error.responseCode >= 500) {
      errorMessage = "SMTP server error. Please try again later.";
      statusCode = 502;
    } else if (error.responseCode >= 400) {
      errorMessage =
        "Email rejected by server. Please check recipient addresses.";
      statusCode = 400;
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.message,
      code: error.code,
      responseCode: error.responseCode,
    });
  }
});

// Updated test email endpoint with CC/BCC support
app.post("/api/email/test", async (req, res) => {
  try {
    const { to, cc, bcc } = req.body;

    if (!to) {
      return res.status(400).json({
        error: "TO recipient email address(es) required",
        example: {
          to: "user@amdocs.com",
          cc: "manager@amdocs.com",
          bcc: "admin@amdocs.com",
          multiple: {
            to: ["user1@amdocs.com", "user2@amdocs.com"],
            cc: ["manager1@amdocs.com", "manager2@amdocs.com"],
            bcc: "admin@amdocs.com",
          },
        },
      });
    }

    // Parse recipients
    const parseRecipients = (recipients) => {
      if (!recipients) return [];
      if (typeof recipients === "string") {
        return recipients
          .split(/[,;\n]/)
          .map((email) => email.trim())
          .filter((email) => email.length > 0);
      } else if (Array.isArray(recipients)) {
        return recipients;
      }
      return [];
    };

    const toRecipients = parseRecipients(to);
    const ccRecipients = parseRecipients(cc);
    const bccRecipients = parseRecipients(bcc);

    const testSubject = "Test Email with CC/BCC from Release Management System";
    const testBody = `This is a test email sent at ${new Date().toLocaleString()}.

If you received this email, the email configuration with CC/BCC is working correctly.

Recipient Information:
=====================
- TO Recipients: ${toRecipients.length}
- CC Recipients: ${ccRecipients.length}
- BCC Recipients: ${bccRecipients.length}
- Total Recipients: ${
      toRecipients.length + ccRecipients.length + bccRecipients.length
    }

System Information:
==================
- Platform: ${process.platform}
- Node.js Version: ${process.version}
- SMTP Server: ${SMTP_CONFIG.host}:${SMTP_CONFIG.port}
- Authentication: Not required
- SSL/TLS: Disabled
- From Email: ${EMAIL_SETTINGS.fromEmail}

Email Settings:
===============
- Maximum Recipients: ${EMAIL_SETTINGS.maxRecipients}
- Allowed Domains: ${EMAIL_SETTINGS.allowedDomains.join(", ")}

Best regards,
Release Management System`;

    const result = await sendEmail(
      toRecipients,
      testSubject,
      testBody,
      "test",
      ccRecipients,
      bccRecipients
    );

    res.json({
      success: true,
      message: `Test email sent successfully to ${result.recipientCount.total} total recipients`,
      messageId: result.messageId,
      recipients: result.recipients,
      recipientCount: result.recipientCount,
    });
  } catch (error) {
    res.status(500).json({
      error: "Test email failed",
      details: error.message,
    });
  }
});

// Initialize data on startup
initializeData()
  .then(() => {
    // Call migration on server start
    migrateReleases();
    app.listen(PORT, () => {
      console.log(`🚀 Release Planning Server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`📁 Data stored in: ${DATA_DIR}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize data:", err);
    process.exit(1);
  });
