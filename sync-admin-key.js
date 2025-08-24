#!/usr/bin/env node
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports, no-undef */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Sync admin key from running Convex backend to environment files
 * Lightweight script focused only on admin key synchronization
 */

// Configuration
const ROOT_DIR = __dirname;
const ENV_LOCAL_FILE = path.join(ROOT_DIR, ".env.local");
const ENV_DOCKER_FILE = path.join(ROOT_DIR, ".env.docker");

/**
 * Parse .env file while preserving formatting, comments, and line order
 */
function parseEnvFileWithFormatting(filePath) {
  const result = {
    lines: [],
    variables: {},
  };

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Environment file not found: ${filePath}`);
    console.log("💡 Run 'node setup-env.js' first to create environment files");
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  for (const line of lines) {
    result.lines.push(line);

    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        result.variables[key] = value;
      }
    }
  }

  return result;
}

/**
 * Write .env file while preserving original formatting around equals signs
 */
function writeEnvFileWithFormatting(filePath, originalLines, updatedVariables) {
  const lines = [];

  for (const line of originalLines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      lines.push(line);
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();

      if (Object.prototype.hasOwnProperty.call(updatedVariables, key)) {
        const beforeEquals = line.substring(0, line.indexOf(key) + key.length);
        const afterEqualsStart = line.indexOf("=", line.indexOf(key));
        const afterEqualsEnd = line.indexOf("=", line.indexOf(key)) + 1;

        const beforeEqualsSpace = line.substring(
          line.indexOf(key) + key.length,
          afterEqualsStart
        );
        const afterEqualsSpace = line.substring(afterEqualsEnd, line.length);

        const afterEqualsSpaceOnly = afterEqualsSpace.match(/^\s*/)[0];

        lines.push(
          `${beforeEquals}${beforeEqualsSpace}=${afterEqualsSpaceOnly}${updatedVariables[key]}`
        );
      } else {
        lines.push(line);
      }
    } else {
      lines.push(line);
    }
  }

  fs.writeFileSync(
    filePath,
    lines.join("\n") +
      (lines.length > 0 && lines[lines.length - 1] !== "" ? "\n" : "")
  );
}

/**
 * Check if backend container is running
 */
function isBackendRunning() {
  try {
    const psResult = execSync("docker compose ps --format json 2>/dev/null", {
      encoding: "utf8",
    });
    const containers = JSON.parse(
      `[${psResult.trim().split("\n").join(",")}]`
    );
    const backend = containers.find((c) => c.Service === "backend");
    return backend && (backend.State === "running" || backend.Health === "healthy");
  } catch (error) {
    return false;
  }
}

/**
 * Get admin key from running Docker container
 */
function getAdminKeyFromBackend() {
  console.log("🔑 Getting admin key from running Convex backend...");

  const containerNames = ["repo-backend-1", "convex-coder-backend-1", "convex-backend-1"];
  
  for (const containerName of containerNames) {
    try {
      const result = execSync(
        `docker exec ${containerName} ./generate_admin_key.sh 2>/dev/null`,
        { encoding: "utf8" }
      );
      
      // Parse the output more carefully
      const lines = result.trim().split("\n");
      const adminKeyLine = lines.find((line) => 
        line.includes("|") && 
        line.startsWith("convex-") && 
        !line.includes("Admin key:")
      );
      
      if (adminKeyLine) {
        console.log(`✅ Retrieved admin key from container: ${containerName}`);
        return adminKeyLine.trim();
      }
    } catch (error) {
      continue;
    }
  }

  console.log("⚠️  Could not get admin key using generate_admin_key.sh, trying direct approach...");
  
  // Try to get the instance name and secret to generate the key deterministically
  try {
    const instanceName = execSync(
      `docker exec ${containerNames[1]} cat /convex/data/credentials/instance_name 2>/dev/null`,
      { encoding: "utf8" }
    ).trim();
    
    const instanceSecret = execSync(
      `docker exec ${containerNames[1]} cat /convex/data/credentials/instance_secret 2>/dev/null`,
      { encoding: "utf8" }
    ).trim();
    
    if (instanceName && instanceSecret) {
      // Use the generate_key binary directly
      const adminKey = execSync(
        `docker exec ${containerNames[1]} ./generate_key "${instanceName}" "${instanceSecret}" 2>/dev/null`,
        { encoding: "utf8" }
      ).trim();
      
      // Parse the output to get just the key part
      const lines = adminKey.split("\n");
      const keyLine = lines.find(line => line.includes("|"));
      if (keyLine) {
        console.log("✅ Generated admin key using instance credentials");
        return keyLine.trim();
      }
    }
  } catch (credError) {
    console.log("⚠️  Could not retrieve instance credentials");
  }
  
  throw new Error("Could not retrieve admin key from backend");
}

/**
 * Update admin key in environment files
 */
function updateEnvFiles(adminKey) {
  let updatedFiles = 0;

  // Update .env.docker (for dashboard)
  if (fs.existsSync(ENV_DOCKER_FILE)) {
    try {
      const dockerParsed = parseEnvFileWithFormatting(ENV_DOCKER_FILE);
      if (dockerParsed.variables.NEXT_PUBLIC_ADMIN_KEY !== adminKey) {
        dockerParsed.variables.NEXT_PUBLIC_ADMIN_KEY = adminKey;
        writeEnvFileWithFormatting(ENV_DOCKER_FILE, dockerParsed.lines, dockerParsed.variables);
        console.log("✅ Updated admin key in .env.docker");
        updatedFiles++;
      } else {
        console.log("ℹ️  .env.docker admin key already up to date");
      }
    } catch (error) {
      console.log(`⚠️  Could not update .env.docker: ${error.message}`);
    }
  }

  // Update .env.local (for frontend)
  if (fs.existsSync(ENV_LOCAL_FILE)) {
    try {
      const localParsed = parseEnvFileWithFormatting(ENV_LOCAL_FILE);
      if (localParsed.variables.CONVEX_SELF_HOSTED_ADMIN_KEY !== adminKey) {
        localParsed.variables.CONVEX_SELF_HOSTED_ADMIN_KEY = adminKey;
        writeEnvFileWithFormatting(ENV_LOCAL_FILE, localParsed.lines, localParsed.variables);
        console.log("✅ Updated admin key in .env.local");
        updatedFiles++;
      } else {
        console.log("ℹ️  .env.local admin key already up to date");
      }
    } catch (error) {
      console.log(`⚠️  Could not update .env.local: ${error.message}`);
    }
  }

  return updatedFiles;
}

/**
 * Main synchronization function
 */
function syncAdminKey() {
  console.log("🔄 Syncing admin key from Convex backend...");

  // Check if environment files exist
  if (!fs.existsSync(ENV_DOCKER_FILE) && !fs.existsSync(ENV_LOCAL_FILE)) {
    console.error("❌ Environment files not found!");
    console.log("💡 Run 'node setup-env.js' first to create environment files");
    process.exit(1);
  }

  // Check if backend is running
  if (!isBackendRunning()) {
    console.error("❌ Convex backend is not running!");
    console.log("💡 Start the backend with: npm run docker:up");
    process.exit(1);
  }

  console.log("✅ Backend is running");

  try {
    // Get admin key from backend
    const adminKey = getAdminKeyFromBackend();
    
    if (!adminKey || adminKey === "placeholder") {
      console.error("❌ Could not retrieve valid admin key from backend");
      process.exit(1);
    }

    console.log("🔑 Admin key retrieved successfully");

    // Update environment files
    const updatedFiles = updateEnvFiles(adminKey);

    if (updatedFiles > 0) {
      console.log("");
      console.log("✅ Admin key synchronization complete!");
      console.log(`📄 Updated ${updatedFiles} environment file(s)`);
      
      // Check if dashboard needs restart
      if (fs.existsSync(ENV_DOCKER_FILE)) {
        console.log("");
        console.log("💡 If the dashboard is already running, restart it to pick up the new key:");
        console.log("   docker compose restart dashboard");
      }
    } else {
      console.log("✅ All admin keys are already up to date");
    }

  } catch (error) {
    console.error("❌ Error syncing admin key:", error.message);
    console.log("");
    console.log("🔍 Troubleshooting:");
    console.log("  • Make sure the backend container is healthy");
    console.log("  • Check that docker compose is running properly");
    console.log("  • Try restarting the backend: docker compose restart backend");
    process.exit(1);
  }
}

// Show current admin key status
function showStatus() {
  console.log("📊 Admin Key Status:");
  console.log("");

  // Check backend status
  const backendRunning = isBackendRunning();
  console.log(`🐳 Backend: ${backendRunning ? "✅ Running" : "❌ Not running"}`);

  // Check .env.docker
  if (fs.existsSync(ENV_DOCKER_FILE)) {
    try {
      const dockerParsed = parseEnvFileWithFormatting(ENV_DOCKER_FILE);
      const dockerKey = dockerParsed.variables.NEXT_PUBLIC_ADMIN_KEY;
      const dockerStatus = dockerKey === "placeholder" || dockerKey === "convex-self-hosted|placeholder" ? 
        "❌ Placeholder" : "✅ Set";
      console.log(`📄 .env.docker: ${dockerStatus}`);
    } catch (error) {
      console.log("📄 .env.docker: ❌ Error reading file");
    }
  } else {
    console.log("📄 .env.docker: ❌ File not found");
  }

  // Check .env.local
  if (fs.existsSync(ENV_LOCAL_FILE)) {
    try {
      const localParsed = parseEnvFileWithFormatting(ENV_LOCAL_FILE);
      const localKey = localParsed.variables.CONVEX_SELF_HOSTED_ADMIN_KEY;
      const localStatus = localKey === "placeholder" ? "❌ Placeholder" : "✅ Set";
      console.log(`📄 .env.local: ${localStatus}`);
    } catch (error) {
      console.log("📄 .env.local: ❌ Error reading file");
    }
  } else {
    console.log("📄 .env.local: ❌ File not found");
  }

  console.log("");
  if (backendRunning) {
    console.log("💡 Run 'node sync-admin-key.js' to sync the admin key");
  } else {
    console.log("💡 Start the backend first: npm run docker:up");
  }
}

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes("--status") || args.includes("-s")) {
    showStatus();
  } else {
    syncAdminKey();
  }
}

module.exports = { syncAdminKey, showStatus };