const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs").promises;
const path = require("path");

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
      totalFeatures: availableReleases.reduce((sum, region) => sum + (region.features?.length || 0), 0), // Added features count
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
