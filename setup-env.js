#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const nodeCrypto = require("crypto");

/**
 * Setup environment configuration for Convex application in Coder workspace
 * Handles URLs, database config, storage - but NOT admin keys
 */

// Configuration
const ROOT_DIR = __dirname;
const ENV_LOCAL_FILE = path.join(ROOT_DIR, ".env.local");
const ENV_LOCAL_EXAMPLE_FILE = path.join(ROOT_DIR, ".env.local.example");
const ENV_DOCKER_FILE = path.join(ROOT_DIR, ".env.docker");
const ENV_DOCKER_EXAMPLE_FILE = path.join(ROOT_DIR, ".env.docker.example");

function isCoderEnvironment() {
  return (
    process.env.CODER === "true" ||
    process.env.CODER_WORKSPACE_NAME !== undefined ||
    process.env.CODER_WORKSPACE_OWNER_NAME !== undefined ||
    process.env.CODER_AGENT_URL !== undefined
  );
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
 * Setup Docker environment configuration (no admin keys)
 */
function setupDockerEnv() {
  console.log("🐳 Setting up Docker environment configuration...");

  const envExists = fs.existsSync(ENV_DOCKER_FILE);
  let originalLines = [];
  let envVars = {};

  if (envExists) {
    console.log(
      "📁 Found existing .env.docker file, updating configuration..."
    );
    const parsed = parseEnvFileWithFormatting(ENV_DOCKER_FILE);
    originalLines = parsed.lines;
    envVars = parsed.variables;
  } else {
    console.log("📋 Creating new .env.docker file from template...");
    if (fs.existsSync(ENV_DOCKER_EXAMPLE_FILE)) {
      const parsed = parseEnvFileWithFormatting(ENV_DOCKER_EXAMPLE_FILE);
      originalLines = parsed.lines;
      envVars = parsed.variables;
    } else {
      console.error("❌ .env.docker.example template not found!");
      process.exit(1);
    }
  }

  const updates = {};

  // Workspace URLs
  if (isCoderEnvironment()) {
    const coderEnv = {
      agentUrl: process.env.CODER_AGENT_URL,
      workspaceName: process.env.CODER_WORKSPACE_NAME,
      workspaceAgentName: process.env.CODER_WORKSPACE_AGENT_NAME,
      workspaceOwnerName: process.env.CODER_WORKSPACE_OWNER_NAME,
    };

    if (
      coderEnv.workspaceOwnerName &&
      coderEnv.workspaceName &&
      coderEnv.agentUrl
    ) {
      const url = new URL(coderEnv.agentUrl);
      const protocol = url.protocol;
      const domain = url.hostname;
      const baseUrl = `${coderEnv.workspaceAgentName}--${coderEnv.workspaceName}--${coderEnv.workspaceOwnerName}.${domain}`;

      updates.CONVEX_CLOUD_ORIGIN = `${protocol}//convex-api--${baseUrl}`;
      updates.CONVEX_SITE_ORIGIN = `${protocol}//convex-proxy--${baseUrl}`;
      updates.NEXT_PUBLIC_DEPLOYMENT_URL = `${protocol}//convex-api--${baseUrl}`;

      console.log(
        `🌐 Workspace: ${coderEnv.workspaceName} (${coderEnv.workspaceOwnerName})`
      );
      console.log(`🔗 Backend URL: ${updates.CONVEX_CLOUD_ORIGIN}`);
    }
  } else {
    console.log("💻 Setting up local development URLs...");
    updates.CONVEX_CLOUD_ORIGIN = "http://localhost:3210";
    updates.CONVEX_SITE_ORIGIN = "http://localhost:3211";
    updates.NEXT_PUBLIC_DEPLOYMENT_URL = "http://localhost:3210";
  }

  // Instance secret (generate if not exists)
  if (
    !envVars.INSTANCE_SECRET ||
    envVars.INSTANCE_SECRET === "${INSTANCE_SECRET}"
  ) {
    updates.INSTANCE_SECRET = nodeCrypto.randomBytes(32).toString("hex");
    console.log("🔐 Generated new INSTANCE_SECRET");
  }

  // Instance name (set default if not exists) - use "app" to match workspace PostgreSQL database
  if (!envVars.INSTANCE_NAME || envVars.INSTANCE_NAME === "${INSTANCE_NAME}") {
    updates.INSTANCE_NAME = "app";
    console.log("🏷️  Set INSTANCE_NAME to: app (matches workspace database)");
  }

  // Database configuration - Use workspace PostgreSQL if available
  if (process.env.PGURI) {
    // Remove database name from URL as Convex manages it separately
    const pgUrl = new URL(process.env.PGURI);
    pgUrl.pathname = ""; // Remove the /app from the path

    const cleanPostgresUrl = pgUrl.toString();

    updates.DATABASE_URL = cleanPostgresUrl;
    updates.POSTGRES_URL = cleanPostgresUrl;

    // Extract PostgreSQL server SSL certificate for PG_CA_FILE
    const { execSync } = require("child_process");
    try {
      console.log("🔐 Extracting PostgreSQL SSL certificates...");
      execSync(
        `timeout 10 openssl s_client -connect ${process.env.PGHOST}.coder-dev-envs:5432 -starttls postgres -showcerts 2>/dev/null | sed -n '/-----BEGIN CERTIFICATE-----/,/-----END CERTIFICATE-----/p' > /tmp/postgres_ca_chain.pem`,
        { stdio: "inherit" }
      );

      // Set PG_CA_FILE environment variable to use extracted certificates
      updates.PG_CA_FILE = "/tmp/postgres_ca_chain.pem";

      // Enable SSL with proper certificate validation
      updates.PGSSLMODE = "require";

      console.log("🗄️  Using workspace PostgreSQL database");
      console.log(
        `📊 Database: ${process.env.PGHOST}:${process.env.PGPORT} (SSL enabled with certificate validation)`
      );
    } catch (error) {
      console.warn(
        "⚠️  Failed to extract SSL certificates, falling back to SSL disabled mode"
      );
      // Fallback to SSL disabled if certificate extraction fails
      updates.DO_NOT_REQUIRE_SSL = "1";
      updates.PGSSLMODE = "disable";
      console.log("🗄️  Using workspace PostgreSQL database");
      console.log(
        `📊 Database: ${process.env.PGHOST}:${process.env.PGPORT} (SSL disabled - fallback mode)`
      );
    }
  } else {
    console.log("🗄️  Using SQLite database (PostgreSQL not available)");
  }

  // Generate MinIO credentials using crypto if not exists or is placeholder
  if (
    !envVars.MINIO_ROOT_USER ||
    envVars.MINIO_ROOT_USER === "${MINIO_ROOT_USER}"
  ) {
    updates.MINIO_ROOT_USER = `convex-${nodeCrypto.randomBytes(8).toString("hex")}`;
    console.log("🔐 Generated new MinIO root user");
  }

  if (
    !envVars.MINIO_ROOT_PASSWORD ||
    envVars.MINIO_ROOT_PASSWORD === "${MINIO_ROOT_PASSWORD}"
  ) {
    updates.MINIO_ROOT_PASSWORD = nodeCrypto.randomBytes(16).toString("hex");
    console.log("🔐 Generated new MinIO root password");
  }

  // Handle S3 configuration if present in template
  const templateContent = originalLines.join("\n");
  const hasS3Config =
    templateContent.includes("AWS_REGION=${AWS_REGION}") &&
    !templateContent.includes("# AWS_REGION=${AWS_REGION}");

  if (hasS3Config) {
    console.log(
      "🔧 S3 configuration detected in template, setting up S3 credentials..."
    );

    if (!envVars.AWS_REGION || envVars.AWS_REGION === "${AWS_REGION}") {
      updates.AWS_REGION = process.env.S3_REGION || "us-east-1";
      console.log(`🌍 Using AWS region: ${updates.AWS_REGION}`);
    }

    if (
      !envVars.AWS_ACCESS_KEY_ID ||
      envVars.AWS_ACCESS_KEY_ID === "${AWS_ACCESS_KEY_ID}"
    ) {
      updates.AWS_ACCESS_KEY_ID = updates.MINIO_ROOT_USER;
      console.log("🔐 Set AWS access key to match MinIO user");
    }

    if (
      !envVars.AWS_SECRET_ACCESS_KEY ||
      envVars.AWS_SECRET_ACCESS_KEY === "${AWS_SECRET_ACCESS_KEY}"
    ) {
      updates.AWS_SECRET_ACCESS_KEY = updates.MINIO_ROOT_PASSWORD;
      console.log("🔐 Set AWS secret key to match MinIO password");
    }
  } else {
    console.log(
      "📁 Using local file storage (S3 configuration commented out in template)"
    );
  }

  // Set placeholder admin key - will be updated by sync-admin-key.js
  if (
    !envVars.NEXT_PUBLIC_ADMIN_KEY ||
    envVars.NEXT_PUBLIC_ADMIN_KEY === "${NEXT_PUBLIC_ADMIN_KEY}" ||
    envVars.NEXT_PUBLIC_ADMIN_KEY === "app|placeholder" ||
    envVars.NEXT_PUBLIC_ADMIN_KEY === "app|placeholder"
  ) {
    updates.NEXT_PUBLIC_ADMIN_KEY = "app|placeholder";
    console.log(
      "🔑 Set placeholder admin key (run 'node sync-admin-key.js' after backend is ready)"
    );
  }

  Object.assign(envVars, updates);
  writeEnvFileWithFormatting(ENV_DOCKER_FILE, originalLines, envVars);

  console.log("✅ Docker environment setup complete!");
  console.log(`📄 Generated file: ${ENV_DOCKER_FILE}`);

  if (Object.keys(updates).length > 0) {
    console.log("🔄 Updated variables:");
    for (const [key, value] of Object.entries(updates)) {
      if (key.includes("SECRET") || key.includes("PASSWORD")) {
        console.log(`   ${key}=<hidden>`);
      } else {
        console.log(`   ${key}=${value}`);
      }
    }
  }
}

/**
 * Setup Convex frontend environment configuration (no admin keys)
 */
function setupConvexEnv() {
  console.log("🔧 Setting up Convex frontend configuration...");

  if (!isCoderEnvironment()) {
    console.log(
      "⚠️  Not running in a coder environment. Using local development setup."
    );
    setupLocalConvexEnv();
    return;
  }

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
    console.log("📁 Found existing .env.local file, updating configuration...");
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
        "# Self-hosted deployment URLs",
        "VITE_CONVEX_URL=",
        "CONVEX_SELF_HOSTED_URL=",
        "",
        "# Admin key (will be set by sync-admin-key.js)",
        "CONVEX_SELF_HOSTED_ADMIN_KEY=placeholder",
        "",
        "# Dashboard and proxy URLs",
        "CONVEX_DASHBOARD_URL=",
        "CONVEX_PROXY_URL=",
        "NEXT_PUBLIC_DEPLOYMENT_URL=",
        "",
      ];
    }
  }

  const updates = {};

  // Check if we should use cloud or self-hosted
  const useCloudConvex = process.env.USE_CLOUD_CONVEX === "true";

  if (useCloudConvex) {
    console.log("☁️  Configuring for Convex Cloud...");
    updates.VITE_CONVEX_URL = envVars.VITE_CONVEX_URL || "";
    updates.CONVEX_DEPLOYMENT = envVars.CONVEX_DEPLOYMENT || "";

    // Comment out self-hosted vars
    delete updates.CONVEX_SELF_HOSTED_URL;
    delete updates.CONVEX_SELF_HOSTED_ADMIN_KEY;
  } else {
    console.log("🏠 Configuring for self-hosted Convex...");

    if (
      coderEnv.workspaceOwnerName &&
      coderEnv.workspaceName &&
      coderEnv.workspaceAgentName &&
      coderEnv.agentUrl
    ) {
      // Use Coder workspace URLs
      const url = new URL(coderEnv.agentUrl);
      const protocol = url.protocol;
      const domain = url.hostname;
      const baseUrl = `${coderEnv.workspaceAgentName}--${coderEnv.workspaceName}--${coderEnv.workspaceOwnerName}.${domain}`;

      const convexBackendUrl = `${protocol}//convex-api--${baseUrl}`;
      const convexDashboardUrl = `${protocol}//convex--${baseUrl}`;
      const convexProxyUrl = `${protocol}//convex-proxy--${baseUrl}`;

      updates.VITE_CONVEX_URL = convexBackendUrl;
      updates.CONVEX_SELF_HOSTED_URL = convexBackendUrl;
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
      updates.CONVEX_DASHBOARD_URL = "http://localhost:6791";
      updates.CONVEX_PROXY_URL = "http://localhost:3211";
      updates.NEXT_PUBLIC_DEPLOYMENT_URL = "http://localhost:3210";

      console.log("🔧 Using localhost URLs for development");
    }

    // Set placeholder admin key - will be updated by sync-admin-key.js
    updates.CONVEX_SELF_HOSTED_ADMIN_KEY = "placeholder";
    console.log(
      "🔑 Set placeholder admin key (run 'node sync-admin-key.js' after backend is ready)"
    );

    // Comment out cloud deployment vars
    delete updates.CONVEX_DEPLOYMENT;
  }

  Object.assign(envVars, updates);
  writeEnvFileWithFormatting(ENV_LOCAL_FILE, originalLines, envVars);

  console.log("✅ Convex frontend setup complete!");
  console.log(`📄 Generated file: ${ENV_LOCAL_FILE}`);

  if (Object.keys(updates).length > 0) {
    console.log("🔄 Updated variables:");
    for (const [key, value] of Object.entries(updates)) {
      console.log(`   ${key}=${value}`);
    }
  }
}

/**
 * Setup local development configuration
 */
function setupLocalConvexEnv() {
  console.log("🏠 Setting up local development configuration...");

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
      "# Self-hosted deployment URLs",
      "VITE_CONVEX_URL=http://localhost:3210",
      "CONVEX_SELF_HOSTED_URL=http://localhost:3210",
      "",
      "# Admin key (will be set by sync-admin-key.js)",
      "CONVEX_SELF_HOSTED_ADMIN_KEY=placeholder",
      "",
      "# Dashboard URL",
      "NEXT_PUBLIC_DEPLOYMENT_URL=http://localhost:3210",
      "",
    ];
  }

  const updates = {
    VITE_CONVEX_URL: "http://localhost:3210",
    CONVEX_SELF_HOSTED_URL: "http://localhost:3210",
    CONVEX_SELF_HOSTED_ADMIN_KEY: "placeholder",
    NEXT_PUBLIC_DEPLOYMENT_URL: "http://localhost:3210",
  };

  Object.assign(envVars, updates);
  writeEnvFileWithFormatting(ENV_LOCAL_FILE, originalLines, envVars);

  console.log("✅ Local Convex setup complete!");
  console.log(
    "🔑 Admin key placeholder set (run 'node sync-admin-key.js' after backend starts)"
  );
}

/**
 * Setup all environment files
 */
function setupAllEnvFiles() {
  console.log("🚀 Setting up all environment files...");

  try {
    // Setup Docker environment
    setupDockerEnv();
    console.log("");

    // Setup frontend environment
    setupConvexEnv();

    console.log("");
    console.log("✅ All environment files setup complete!");
    console.log("");
    console.log("📋 Next steps:");
    console.log("  1. Start the backend: npm run docker:up");
    console.log("  2. Sync admin keys: node sync-admin-key.js");
    console.log("  3. Start development: npm run dev");
  } catch (error) {
    console.error("❌ Error setting up environment files:", error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  try {
    setupAllEnvFiles();
  } catch (error) {
    console.error("❌ Error setting up environment files:", error.message);
    process.exit(1);
  }
}

module.exports = { setupConvexEnv, setupDockerEnv, setupAllEnvFiles };
