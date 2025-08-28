#!/usr/bin/env node

/**
 * Startup Admin Key Sync Script
 * 
 * This script:
 * 1. Waits for the Convex backend to be healthy
 * 2. Gets the current admin key from the backend
 * 3. Compares it with the key in environment files
 * 4. Updates environment files if key has changed
 * 5. Restarts dashboard if key was updated
 * 
 * Designed to run automatically on workspace startup
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const ENV_DOCKER_FILE = path.join(ROOT_DIR, ".env.docker");
const ENV_LOCAL_FILE = path.join(ROOT_DIR, ".env.local");

// Color logging functions
const colors = {
  info: (msg) => `\x1b[36m${msg}\x1b[0m`,    // Cyan
  success: (msg) => `\x1b[32m${msg}\x1b[0m`, // Green
  warning: (msg) => `\x1b[33m${msg}\x1b[0m`, // Yellow
  error: (msg) => `\x1b[31m${msg}\x1b[0m`,   // Red
};

function log(level, message) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${timestamp}] ${colors[level](message)}`);
}

/**
 * Wait for backend to be healthy with timeout
 */
async function waitForBackend(maxAttempts = 30, intervalMs = 2000) {
  log('info', '⏳ Waiting for Convex backend to be healthy...');
  
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      execSync('curl -fs http://localhost:3210/version', { 
        stdio: 'pipe',
        timeout: 5000 
      });
      log('success', '✅ Backend is healthy!');
      return true;
    } catch {
      if (attempt < maxAttempts) {
        log('info', `🔄 Backend not ready (attempt ${attempt}/${maxAttempts}), retrying in ${intervalMs/1000}s...`);
        await new Promise((resolve) => { setTimeout(resolve, intervalMs); });
      }
    }
  }
  
  log('error', `❌ Backend failed to become healthy after ${maxAttempts} attempts`);
  return false;
}

/**
 * Get current admin key from backend using Docker exec
 */
function getCurrentAdminKey() {
  try {
    log('info', '🔑 Retrieving admin key from backend...');
    
    // Get admin key directly from backend container
    const result = execSync('docker compose exec -T backend ./generate_admin_key.sh', { 
      stdio: 'pipe',
      encoding: 'utf-8',
      cwd: ROOT_DIR 
    });
    
    // Extract admin key from output (format: "app|<key>")
    const match = result.match(/app\|[a-f0-9]+/);
    if (match) {
      return match[0];
    }
    
    // If that fails, try the sync-admin-key.js approach
    log('info', '🔄 Trying alternative admin key retrieval...');
    const syncResult = execSync('node sync-admin-key.js --status', { 
      stdio: 'pipe',
      encoding: 'utf-8',
      cwd: ROOT_DIR 
    });
    
    const syncMatch = syncResult.match(/app\|[a-f0-9]+/);
    if (syncMatch) {
      return syncMatch[0];
    }
    
    throw new Error('Could not parse admin key from any method');
  } catch (error) {
    log('error', `❌ Failed to get admin key: ${error.message}`);
    return null;
  }
}

/**
 * Get admin key from environment file
 */
function getEnvAdminKey(envFile) {
  try {
    if (!fs.existsSync(envFile)) {
      return null;
    }
    
    const content = fs.readFileSync(envFile, 'utf-8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('NEXT_PUBLIC_ADMIN_KEY=') || 
          trimmed.startsWith('CONVEX_SELF_HOSTED_ADMIN_KEY=')) {
        const value = trimmed.split('=')[1];
        if (value && value !== 'placeholder') {
          return value;
        }
      }
    }
    return null;
  } catch (error) {
    log('warning', `⚠️  Could not read admin key from ${envFile}: ${error.message}`);
    return null;
  }
}

/**
 * Check if dashboard is running
 */
function isDashboardRunning() {
  try {
    execSync('curl -fs http://localhost:6791', { 
      stdio: 'pipe',
      timeout: 3000 
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Restart dashboard container
 */
function restartDashboard() {
  try {
    log('info', '🔄 Restarting dashboard to pick up new admin key...');
    execSync('docker compose restart dashboard', { 
      stdio: 'pipe',
      cwd: ROOT_DIR 
    });
    log('success', '✅ Dashboard restarted successfully!');
    return true;
  } catch (error) {
    log('error', `❌ Failed to restart dashboard: ${error.message}`);
    return false;
  }
}

/**
 * Main startup sync function
 */
async function main() {
  log('info', '🚀 Starting admin key sync check...');
  
  // Wait for backend to be healthy
  const backendReady = await waitForBackend();
  if (!backendReady) {
    log('error', '❌ Backend is not healthy, cannot sync admin key');
    process.exit(1);
  }
  
  // Small delay to ensure backend is fully ready
  await new Promise((resolve) => { setTimeout(resolve, 2000); });
  
  // Get current admin key from backend
  const currentKey = getCurrentAdminKey();
  if (!currentKey) {
    log('error', '❌ Could not retrieve admin key from backend');
    process.exit(1);
  }
  
  log('success', `✅ Retrieved admin key: ${currentKey.substring(0, 15)}...`);
  
  // Check admin keys in environment files
  const dockerEnvKey = getEnvAdminKey(ENV_DOCKER_FILE);
  const localEnvKey = getEnvAdminKey(ENV_LOCAL_FILE);
  
  let needsUpdate = false;
  let needsRestart = false;
  
  // Check if keys are different or missing
  if (!dockerEnvKey || dockerEnvKey !== currentKey) {
    log('info', '🔄 Docker environment admin key needs update');
    needsUpdate = true;
  }
  
  if (!localEnvKey || localEnvKey !== currentKey) {
    log('info', '🔄 Local environment admin key needs update');
    needsUpdate = true;
  }
  
  if (!needsUpdate) {
    log('success', '✅ Admin keys are already up to date!');
    return;
  }
  
  // Update admin keys using existing sync script
  try {
    log('info', '📝 Updating admin keys in environment files...');
    execSync('node sync-admin-key.js', { 
      stdio: 'pipe',
      cwd: ROOT_DIR 
    });
    log('success', '✅ Admin keys updated successfully!');
    needsRestart = true;
  } catch (error) {
    log('error', `❌ Failed to update admin keys: ${error.message}`);
    process.exit(1);
  }
  
  // Restart dashboard if needed and it's running
  if (needsRestart && isDashboardRunning()) {
    const restarted = restartDashboard();
    if (restarted) {
      // Wait a moment for dashboard to start up
      await new Promise((resolve) => { setTimeout(resolve, 3000); });
      
      if (isDashboardRunning()) {
        log('success', '🎉 Startup admin key sync complete! Dashboard is ready.');
      } else {
        log('warning', '⚠️  Dashboard may still be starting up...');
      }
    }
  } else if (needsRestart) {
    log('info', '💡 Admin keys updated. Dashboard will use new key on next start.');
  }
  
  log('success', '🏁 Admin key sync check completed successfully!');
}

// Run main function
main().catch(error => {
  log('error', `❌ Startup sync failed: ${error.message}`);
  process.exit(1);
});