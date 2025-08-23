#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const nodeCrypto = require("crypto");
const { execSync } = require("child_process");

/**
 * Generate .env files for Convex application in Coder workspace
 * Configures both local development and Coder workspace URLs
 */

// Configuration
const ROOT_DIR = __dirname;
const ENV_LOCAL_FILE = path.join(ROOT_DIR, ".env.local");
const ENV_LOCAL_EXAMPLE_FILE = path.join(ROOT_DIR, ".env.local.example");

function isCoderEnvironment() {
  return (
    process.env.CODER === "true" ||
    process.env.CODER_WORKSPACE_NAME !== undefined ||
    process.env.CODER_WORKSPACE_OWNER_NAME !== undefined ||
    process.env.CODER_AGENT_URL !== undefined
  );
}

/**
 * Generate a secure admin key for Convex self-hosted
 */
function generateConvexAdminKey() {
  return nodeCrypto.randomBytes(32).toString("hex");
}

/**
 * Get admin key from running Docker container
 */
function getDockerAdminKey() {
  try {
    console.log(
      "🔑 Getting admin key from running Convex backend container..."
    );

    // Try to get admin key from repo-backend-1 container first
    let containerName = "repo-backend-1";
    try {
      const result = execSync(
        `docker exec ${containerName} ./generate_admin_key.sh 2>/dev/null`,
        { encoding: "utf8" }
      );
      const lines = result.trim().split("\n");
      const adminKeyLine = lines.find((line) => line.includes("|"));
      if (adminKeyLine) {
        console.log("✅ Retrieved admin key from Docker container");
        return adminKeyLine.trim();
      }
    } catch (error) {
      // Try alternative container names
      const alternativeNames = ["convex-coder-backend-1", "convex-backend-1"];
      for (const name of alternativeNames) {
        try {
          const result = execSync(
            `docker exec ${name} ./generate_admin_key.sh 2>/dev/null`,
            { encoding: "utf8" }
          );
          const lines = result.trim().split("\n");
          const adminKeyLine = lines.find((line) => line.includes("|"));
          if (adminKeyLine) {
            console.log(
              `✅ Retrieved admin key from Docker container: ${name}`
            );
            return adminKeyLine.trim();
          }
        } catch (altError) {
          continue;
        }
      }
    }

    console.log(
      "⚠️  Could not get admin key from Docker container, generating random key"
    );
    return `convex-self-hosted|${generateConvexAdminKey()}`;
  } catch (error) {
    console.log("⚠️  Error getting admin key from Docker:", error.message);
    return `convex-self-hosted|${generateConvexAdminKey()}`;
  }
}

/**
 * Start Docker containers and wait for backend to be ready
 */
async function ensureDockerRunning() {
  try {
    console.log("🐳 Ensuring Docker containers are running...");

    // Check if containers are already running
    try {
      const psResult = execSync("docker compose ps --format json 2>/dev/null", {
        encoding: "utf8",
      });
      const containers = JSON.parse(
        `[${psResult.trim().split("\n").join(",")}]`
      );
      const backendRunning = containers.some(
        (c) => c.Service === "backend" && c.State === "running"
      );

      if (backendRunning) {
        console.log("✅ Docker backend is already running");
        return true;
      }
    } catch (error) {
      // Containers not running, need to start them
    }

    console.log("🚀 Starting Docker containers...");
    execSync("npm run docker:up", { stdio: "inherit" });

    // Wait for backend to be healthy
    console.log("⏳ Waiting for backend to be healthy...");
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      try {
        const healthResult = execSync(
          "docker compose ps --format json 2>/dev/null",
          { encoding: "utf8" }
        );
        const containers = JSON.parse(
          `[${healthResult.trim().split("\n").join(",")}]`
        );
        const backend = containers.find((c) => c.Service === "backend");

        if (backend && backend.Health === "healthy") {
          console.log("✅ Backend is healthy and ready");
          return true;
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      } catch (error) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;
      }
    }

    console.log("⚠️  Backend health check timeout, proceeding anyway");
    return false;
  } catch (error) {
    console.log("⚠️  Error starting Docker containers:", error.message);
    return false;
  }
}

/**
 * Parse .env file while preserving formatting, comments, and line order
 */
function parseEnvFileWithFormatting(filePath) {
  const result = {
    lines: [],
    variables: {},
  };

  if (!fs.existsSync(filePath)) {
    return result;
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

      if (updatedVariables.hasOwnProperty(key)) {
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

  // Add any new variables that weren't in the original file
  const existingKeys = new Set();
  for (const line of originalLines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        existingKeys.add(key);
      }
    }
  }

  for (const [key, value] of Object.entries(updatedVariables)) {
    if (!existingKeys.has(key)) {
      lines.push(`${key}=${value}`);
    }
  }

  fs.writeFileSync(
    filePath,
    lines.join("\n") +
      (lines.length > 0 && lines[lines.length - 1] !== "" ? "\n" : "")
  );
}

/**
 * Generate Convex environment configuration
 */
async function generateConvexEnv() {
  console.log("🔧 Generating Convex .env.local configuration...");

  if (!isCoderEnvironment()) {
    console.log(
      "⚠️  Not running in a coder environment. Using local development setup."
    );
    await generateLocalConvexEnv();
    return;
  }

  // Ensure Docker containers are running before getting admin key
  await ensureDockerRunning();

  const coderEnv = {
    agentUrl: process.env.CODER_AGENT_URL,
    workspaceName: process.env.CODER_WORKSPACE_NAME,
    workspaceAgentName: process.env.CODER_WORKSPACE_AGENT_NAME,
    workspaceOwnerName: process.env.CODER_WORKSPACE_OWNER_NAME,
  };

  console.log(
    `🌐 Workspace: ${coderEnv.workspaceName} (${coderEnv.workspaceOwnerName})`
  );
  console.log(`🔗 Agent: ${coderEnv.workspaceAgentName}`);

  const envExists = fs.existsSync(ENV_LOCAL_FILE);
  let originalLines = [];
  let envVars = {};

  if (envExists) {
    console.log(
      "📁 Found existing .env.local file, updating Convex configuration..."
    );
    const parsed = parseEnvFileWithFormatting(ENV_LOCAL_FILE);
    originalLines = parsed.lines;
    envVars = parsed.variables;
  } else {
    console.log("📋 Creating new .env.local file...");
    if (fs.existsSync(ENV_LOCAL_EXAMPLE_FILE)) {
      const parsed = parseEnvFileWithFormatting(ENV_LOCAL_EXAMPLE_FILE);
      originalLines = parsed.lines;
      envVars = parsed.variables;
    } else {
      console.log(
        "⚠️  No .env.local.example file found, creating minimal configuration..."
      );
      originalLines = [
        "# Convex Configuration",
        "",
        "# Deployment used by `npx convex dev` (comment out when using self-hosted)",
        "# CONVEX_DEPLOYMENT=",
        "",
        "# Cloud deployment URL (comment out when using self-hosted)",
        "# VITE_CONVEX_URL=",
        "",
        "# Self-hosted deployment URL (uncomment when using self-hosted)",
        "VITE_CONVEX_URL=",
        "",
        "# Self-hosted configuration (uncomment when using self-hosted)",
        "CONVEX_SELF_HOSTED_URL=",
        "CONVEX_SELF_HOSTED_ADMIN_KEY=",
        "",
      ];
    }
  }

  const updates = {};

  // Check if we should use cloud or self-hosted
  const useCloudConvex = process.env.USE_CLOUD_CONVEX === "true";

  if (useCloudConvex) {
    console.log("☁️  Configuring for Convex Cloud...");
    // For cloud Convex, we need to set up deployment URL
    // This would be configured after running `convex dev`
    updates.VITE_CONVEX_URL = envVars.VITE_CONVEX_URL || "";
    updates.CONVEX_DEPLOYMENT = envVars.CONVEX_DEPLOYMENT || "";

    // Comment out self-hosted vars
    delete updates.CONVEX_SELF_HOSTED_URL;
    delete updates.CONVEX_SELF_HOSTED_ADMIN_KEY;
  } else {
    console.log("🏠 Configuring for self-hosted Convex...");

    // Get admin key from Docker container or generate one
    const adminKey = getDockerAdminKey();

    if (
      coderEnv.workspaceOwnerName &&
      coderEnv.workspaceName &&
      coderEnv.workspaceAgentName &&
      coderEnv.agentUrl
    ) {
      // Use Coder workspace URLs
      const url = new URL(coderEnv.agentUrl);
      const protocol = url.protocol; // includes the ':' (e.g., 'https:')
      const domain = url.hostname;
      const baseUrl = `${coderEnv.workspaceAgentName}--${coderEnv.workspaceName}--${coderEnv.workspaceOwnerName}.${domain}`;

      // Convex backend and dashboard URLs (matching Coder app slugs)
      const convexBackendUrl = `${protocol}//convex-api--${baseUrl}`;
      const convexDashboardUrl = `${protocol}//convex--${baseUrl}`;
      const convexProxyUrl = `${protocol}//convex-proxy--${baseUrl}`;

      updates.VITE_CONVEX_URL = convexBackendUrl;
      updates.CONVEX_SELF_HOSTED_URL = convexBackendUrl;
      updates.CONVEX_SELF_HOSTED_ADMIN_KEY = adminKey;
      updates.CONVEX_DASHBOARD_URL = convexDashboardUrl;
      updates.CONVEX_PROXY_URL = convexProxyUrl;
      updates.NEXT_PUBLIC_DEPLOYMENT_URL = convexBackendUrl;

      console.log(`🔧 Convex Backend URL: ${convexBackendUrl}`);
      console.log(`📊 Convex Dashboard URL: ${convexDashboardUrl}`);
      console.log(`🌐 Convex Proxy URL: ${convexProxyUrl}`);
    } else {
      // Fallback to localhost
      updates.VITE_CONVEX_URL = "http://localhost:3210";
      updates.CONVEX_SELF_HOSTED_URL = "http://localhost:3210";
      updates.CONVEX_SELF_HOSTED_ADMIN_KEY = adminKey;
      updates.CONVEX_DASHBOARD_URL = "http://localhost:6791";
      updates.CONVEX_PROXY_URL = "http://localhost:3211";
      updates.NEXT_PUBLIC_DEPLOYMENT_URL = "http://localhost:3210";

      console.log("🔧 Using localhost URLs for development");
    }

    // Comment out cloud deployment vars
    delete updates.CONVEX_DEPLOYMENT;
  }

  Object.assign(envVars, updates);
  writeEnvFileWithFormatting(ENV_LOCAL_FILE, originalLines, envVars);

  console.log("✅ Convex .env.local file generated successfully!");
  console.log(`📄 Generated file: ${ENV_LOCAL_FILE}`);

  if (Object.keys(updates).length > 0) {
    console.log("🔄 Updated variables:");
    for (const [key, value] of Object.entries(updates)) {
      if (key.includes("ADMIN_KEY")) {
        console.log(`   ${key}=<hidden>`);
      } else {
        console.log(`   ${key}=${value}`);
      }
    }
  }
}

/**
 * Generate local development configuration
 */
async function generateLocalConvexEnv() {
  console.log("🏠 Generating local development configuration...");

  // Ensure Docker containers are running before getting admin key
  await ensureDockerRunning();

  const envExists = fs.existsSync(ENV_LOCAL_FILE);
  let originalLines = [];
  let envVars = {};

  if (envExists) {
    const parsed = parseEnvFileWithFormatting(ENV_LOCAL_FILE);
    originalLines = parsed.lines;
    envVars = parsed.variables;
  } else {
    originalLines = [
      "# Convex Local Development Configuration",
      "",
      "# Self-hosted deployment URL",
      "VITE_CONVEX_URL=http://localhost:3210",
      "",
      "# Self-hosted configuration",
      "CONVEX_SELF_HOSTED_URL=http://localhost:3210",
      "CONVEX_SELF_HOSTED_ADMIN_KEY=",
      "",
    ];
  }

  // Get admin key from Docker container
  const adminKey = getDockerAdminKey();

  const updates = {
    VITE_CONVEX_URL: "http://localhost:3210",
    CONVEX_SELF_HOSTED_URL: "http://localhost:3210",
    CONVEX_SELF_HOSTED_ADMIN_KEY: adminKey,
    NEXT_PUBLIC_DEPLOYMENT_URL: "http://localhost:3210",
  };

  Object.assign(envVars, updates);
  writeEnvFileWithFormatting(ENV_LOCAL_FILE, originalLines, envVars);

  console.log("✅ Local Convex .env.local file generated!");
  console.log("🔑 Retrieved admin key from Docker container");
}

// Run the script
if (require.main === module) {
  try {
    generateConvexEnv().catch((error) => {
      console.error("❌ Error generating Convex .env file:", error.message);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Error generating Convex .env file:", error.message);
    process.exit(1);
  }
}

module.exports = { generateConvexEnv };
