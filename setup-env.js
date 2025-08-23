#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Setup environment variables from .env.local for docker-compose
 */

// Read .env.local file if it exists
function loadEnvLocal() {
  const envLocalPath = path.join(__dirname, ".env.local");
  const envVars = {};

  if (fs.existsSync(envLocalPath)) {
    const content = fs.readFileSync(envLocalPath, "utf8");
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const equalIndex = trimmed.indexOf("=");
        if (equalIndex > 0) {
          const key = trimmed.substring(0, equalIndex).trim();
          const value = trimmed.substring(equalIndex + 1).trim();
          envVars[key] = value;
        }
      }
    }
  }

  return envVars;
}

// Main function
function setupEnv() {
  try {
    // Read .env.docker.example
    const examplePath = path.join(__dirname, ".env.docker.example");
    if (!fs.existsSync(examplePath)) {
      console.error("❌ .env.docker.example not found");
      process.exit(1);
    }

    const envTemplate = fs.readFileSync(examplePath, "utf8");

    // Load variables from .env.local
    const envLocalVars = loadEnvLocal();

    // Combine process.env and .env.local variables (process.env takes precedence)
    const allVars = { ...envLocalVars, ...process.env };

    // Replace variables in template
    const replaced = envTemplate.replace(/\$\{([^}]+)\}/g, (match, key) => {
      return allVars[key] || "";
    });

    // Write to .env.docker
    const dockerEnvPath = path.join(__dirname, ".env.docker");
    fs.writeFileSync(dockerEnvPath, replaced);

    console.log("✅ Generated .env.docker from template");

    // Log any substitutions made
    const substitutions = [];
    envTemplate.replace(/\$\{([^}]+)\}/g, (match, key) => {
      const value = allVars[key];
      if (value) {
        substitutions.push({
          key,
          value: key.includes("KEY") ? "<hidden>" : value,
        });
      }
      return match;
    });

    if (substitutions.length > 0) {
      console.log("🔄 Variable substitutions:");
      for (const { key, value } of substitutions) {
        // Skip S3 variables for now (DNS resolution issues in Docker)
        if (key.startsWith("S3_") || key.startsWith("AWS_")) {
          continue;
        }
        console.log(`   ${key}=${value}`);
      }
    }
  } catch (error) {
    console.error("❌ Error setting up environment:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  setupEnv();
}

module.exports = { setupEnv };
