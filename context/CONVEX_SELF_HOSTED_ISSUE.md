# Convex Self-Hosted Deployment Issues and Solutions

## Executive Summary

This document details the issues encountered when trying to deploy Convex functions to a self-hosted backend in a Coder workspace environment, and the successful workaround implemented.

## The Problem

When attempting to run `pnpm dev:backend` (which runs `convex dev`) in a Coder workspace with a self-hosted Convex backend, the deployment would fail, preventing the application from functioning. The frontend would show errors like:

```
Uncaught Error: [CONVEX Q(chat:getMessages)] [Request ID: 5d7e31edd55de47e] Server Error
```

This occurred because the Convex functions were never successfully deployed to the backend.

## Root Causes Identified

### 1. Convex CLI Version Incompatibility

**Issue**: Convex CLI version 1.26.1 has a bug when working with self-hosted deployments.

**Error Message**:
```
Unexpected Error: TypeError: Cannot read properties of undefined (reading 'length')
```

This error occurs after the bundling step, preventing deployment to self-hosted backends.

**Solution**: Downgrade to Convex CLI version 1.24.8, which is known to work with self-hosted deployments.

### 2. S3 Storage DNS Resolution Failure

**Issue**: The Docker containers cannot resolve internal Coder workspace S3 endpoints.

**Error in Backend Logs**:
```
Failed to create multipart upload: dispatch failure: other: client error (Connect): 
dns error: failed to lookup address information: Name or service not known
```

The S3 endpoint `s3.us-central-1.hahomelabs.com` is an internal Coder hostname that cannot be resolved from within Docker containers.

**Solution**: Disable S3 configuration and use local file storage instead.

### 3. Backend Storage Type Immutability

**Issue**: Once a Convex backend is initialized with a specific storage type (S3 or local), it cannot be changed without resetting the data.

**Error Message**:
```
Database was initialized with Some(S3 { s3_prefix: "convex-coder-workspace-..." }), 
but backend started up with Local { dir: "/convex/data/storage" }
```

**Solution**: Reset the backend by removing Docker volumes when changing storage configuration.

## The Complete Workaround

### Step 1: Downgrade Convex CLI

```bash
pnpm add convex@1.24.8
```

### Step 2: Disable S3 Configuration

Update `.env.docker.example` to use empty S3 variables:

```env
# AWS S3 configuration - DISABLED due to DNS resolution issues in Docker
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
S3_STORAGE_EXPORTS_BUCKET=
S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET=
S3_STORAGE_MODULES_BUCKET=
S3_STORAGE_FILES_BUCKET=
S3_STORAGE_SEARCH_BUCKET=
S3_ENDPOINT_URL=
```

### Step 3: Set SSL Configuration

Ensure `DO_NOT_REQUIRE_SSL=true` in `.env.docker.example` for local development.

### Step 4: Reset Backend Data

If the backend was previously initialized with S3:

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Start fresh
docker-compose --env-file .env.docker up -d

# Generate new admin key
docker-compose exec backend ./generate_admin_key.sh

# Update .env.local with the new admin key
```

### Step 5: Deploy Functions

```bash
# Deploy functions to the self-hosted backend
npx convex dev --once

# Or run in development mode with watch
npx convex dev
```

## Configuration Files

### Working docker-compose.yml

```yaml
services:
  backend:
    image: ghcr.io/get-convex/convex-backend:c1a7ac393888d743e704de56cf569a154b4526d4
    stop_grace_period: 10s
    stop_signal: SIGINT
    ports:
      - "${PORT:-3210}:3210"
      - "${SITE_PROXY_PORT:-3211}:3211"
    volumes:
      - data:/convex/data
    environment:
      # ... standard environment variables ...
      # S3 variables should be empty or not set
    healthcheck:
      test: curl -f http://localhost:3210/version
      interval: 5s
      start_period: 10s
```

### Working .env.local

```env
# Self-hosted deployment URL
VITE_CONVEX_URL=https://convex-api--main--<workspace>--<owner>.coder.hahomelabs.com
CONVEX_SELF_HOSTED_URL=https://convex-api--main--<workspace>--<owner>.coder.hahomelabs.com
CONVEX_SELF_HOSTED_ADMIN_KEY=<your-admin-key>
```

## Limitations of the Workaround

1. **No S3 Storage**: Files are stored locally in Docker volumes instead of S3
2. **No Cross-Container File Access**: Files stored in the backend are not accessible from other services
3. **Limited Scalability**: Local storage doesn't scale as well as S3 for large files
4. **Backup Complexity**: Need to backup Docker volumes instead of relying on S3 durability

## Alternative Solutions (Not Implemented)

1. **Fix DNS Resolution**: Could potentially add custom DNS entries or use host networking
2. **Use External S3**: Configure an external S3 service that's publicly accessible
3. **Patch Convex CLI**: Fix the bug in version 1.26.1 (requires upstream contribution)
4. **Direct API Deployment**: Use Convex backend REST API directly (not documented)

## Verification Steps

To verify the setup is working:

```bash
# Check backend is healthy
curl https://your-backend-url/version

# Test function deployment
npx convex dev --once

# Query a function directly
curl -X POST https://your-backend-url/api/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Convex your-admin-key" \
  -d '{"path": "chat:getMessages", "args": {}}'
```

## Related Issues

- Convex CLI self-hosted support is limited (acknowledged by the team)
- GitHub Issues should be filed at: https://github.com/get-convex/convex-backend/issues
- Community support available in Discord #self-hosted channel

## Conclusion

While self-hosted Convex deployments face challenges in containerized environments like Coder workspaces, this workaround provides a functional solution by:
1. Using a compatible CLI version
2. Avoiding DNS resolution issues by disabling S3
3. Using local storage for file handling

This enables full development workflow with hot reloading and function deployment, though with some storage limitations compared to a cloud-based setup.