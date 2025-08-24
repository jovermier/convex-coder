# Convex Self-Hosted File Upload Configuration Summary

## Overview
This document summarizes the configuration work completed to enable file uploads in a Convex self-hosted environment running in a Coder workspace. The final solution uses local file storage after encountering compatibility issues with S3-based storage backends.

## Problem Statement
The initial goal was to configure file uploads in a Convex self-hosted deployment using the workspace's S3 storage (Rook Ceph RADOS Gateway). Multiple compatibility issues were encountered that led to adopting local file storage as the solution.

## Technical Challenges Encountered

### 1. S3 Server-Side Encryption Header Incompatibility
- **Issue**: Convex backend hardcodes server-side encryption headers (`x-amz-server-side-encryption`) that Rook Ceph RGW doesn't support
- **Error**: `InvalidArgument: Server-side-encryption with aws:kms is not supported`
- **Impact**: All file upload requests to Rook Ceph failed

### 2. AWS Signature Incompatibility
- **Issue**: Convex's AWS SDK v4 signature generation incompatible with Rook Ceph RGW implementation
- **Error**: `SignatureDoesNotMatch` errors during S3 operations
- **Impact**: Authentication failures prevented successful S3 operations

### 3. Environment Variable Configuration Complexity
- **Issue**: Multiple environment files (`.env`, `.env.docker`, `.env.local`) with different precedence
- **Specific Problem**: `.env.docker` contained `NEXT_PUBLIC_DEPLOYMENT_URL=http://localhost:3210` which overrode the correct workspace URL from `.env`
- **Impact**: Dashboard and React app were using incorrect backend URLs, showing localhost instead of proper workspace DNS

### 4. Coder Workspace Port Constraints
- **Issue**: Attempted to change React app port, but Coder workspaces have predefined port mappings
- **Impact**: Required understanding of workspace networking constraints

## Attempted Solutions

### 1. S3 Proxy Implementations
- **s3proxy**: Basic Java-based S3 proxy - insufficient header manipulation capabilities
- **nginx**: HTTP proxy with header modification - limited S3-specific protocol support
- **Envoy Proxy**: Advanced proxy with Lua scripting for header stripping - most promising but still couldn't resolve all compatibility issues

### 2. MinIO Alternative
- **Approach**: Replace Rook Ceph with MinIO S3-compatible storage
- **Result**: Similar compatibility issues with Convex's hardcoded encryption headers
- **Configuration**: Docker Compose service with Envoy proxy for header manipulation

## Final Solution: Local File Storage

### Configuration Changes

#### 1. Backend Configuration (`.env`)
```bash
# Removed all S3 configuration
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_STORAGE_FILES_BUCKET=
S3_ENDPOINT_URL=

# Set correct deployment URL for Coder workspace
NEXT_PUBLIC_DEPLOYMENT_URL=https://convex-api--main--<workspace>--<owner>.coder.hahomelabs.com
```

#### 2. Docker Services (`.env.docker`)
```bash
# All S3 variables set to empty for local storage
AWS_REGION=
S3_STORAGE_EXPORTS_BUCKET=
S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET=
S3_STORAGE_MODULES_BUCKET=
S3_STORAGE_FILES_BUCKET=
S3_STORAGE_SEARCH_BUCKET=
S3_ENDPOINT_URL=
```

#### 3. Frontend Configuration (`.env.local`)
```bash
# React app connects to local backend
VITE_CONVEX_URL=http://localhost:3210
CONVEX_SELF_HOSTED_URL=https://convex-api--main--<workspace>--<owner>.coder.hahomelabs.com
```

#### 4. Docker Compose Simplification
- Removed MinIO service
- Removed Envoy proxy service  
- Retained only backend and dashboard services
- Backend configured for local file storage
- **Critical Fix**: Added `env_file: - .env` to dashboard service to ensure it reads the correct deployment URL
- **Critical Fix**: Removed conflicting `NEXT_PUBLIC_DEPLOYMENT_URL` line from `.env.docker`

### Key Environment Variable Roles

1. **`.env`**: Primary environment file read by Docker Compose
2. **`.env.docker`**: Backend service environment variables
3. **`.env.local`**: Frontend React application configuration

## Coder Workspace Integration

### URL Configuration
- **Backend API**: `https://convex-api--main--<workspace>--<owner>.coder.hahomelabs.com`
- **Dashboard**: `http://localhost:6791` (internally routed)
- **React App**: `http://localhost:5173` (development server)

### Port Mapping
- **3210**: Convex backend API
- **3211**: Site proxy (unused in current config)
- **6791**: Dashboard interface

## File Storage Architecture

### Local Storage Benefits
1. **No S3 compatibility issues**: Eliminates all server-side encryption header problems
2. **Simplified configuration**: No AWS credentials or bucket management required
3. **Fast access**: Direct filesystem access without network overhead
4. **Development-friendly**: Easy to inspect and debug stored files

### Storage Location
Files are stored in the Docker volume `data:/convex/data` within the backend container.

## Testing and Verification

### Dashboard Access
- URL: `http://localhost:6791`
- Should connect to backend at the correct workspace URL
- File upload functionality available through dashboard interface

### Backend Health Check
- Endpoint: `http://localhost:3210/version`
- Used by Docker Compose health check
- Verifies backend service availability

## Lessons Learned

1. **S3 Compatibility**: Not all S3-compatible storage backends support the same feature set as AWS S3
2. **Header Injection**: Some applications hardcode headers that may be incompatible with alternative storage backends
3. **Environment Precedence**: Multiple environment files can create configuration conflicts - always ensure dashboard service has `env_file` directive in docker-compose
4. **Docker Compose Service Configuration**: Services need explicit `env_file` directives to read environment files; they don't inherit them automatically
5. **Workspace Constraints**: Coder workspaces have specific networking and port requirements

## Future Considerations

### Production Deployment
For production use, consider:
1. **Proper S3 Backend**: Use AWS S3 or fully compatible storage service
2. **Security**: Change default instance secret and admin keys
3. **Persistence**: Ensure proper backup strategy for local storage
4. **Scaling**: Local storage doesn't scale across multiple backend instances

### Alternative Storage Solutions
1. **Google Cloud Storage**: May have better compatibility than Rook Ceph
2. **Azure Blob Storage**: Another potential alternative to investigate
3. **Custom Storage Adapter**: Modify Convex backend to support different storage backends

## Configuration Files Summary

| File | Purpose | Key Settings |
|------|---------|--------------|
| `.env` | Docker Compose environment | `NEXT_PUBLIC_DEPLOYMENT_URL` |
| `.env.docker` | Backend service config | S3 variables (empty for local storage) |
| `.env.local` | React app config | `VITE_CONVEX_URL` |
| `docker-compose.yml` | Service orchestration | Backend and dashboard services only |

## Recent Update: Dashboard URL Fix

### Issue
After initial configuration, the dashboard at `https://convex--main--<workspace>--<owner>.coder.hahomelabs.com/` was still showing `localhost:3210` instead of the proper workspace DNS URL.

### Root Cause  
The dashboard service in `docker-compose.yml` was missing the `env_file: - .env` directive, so it wasn't reading the correct `NEXT_PUBLIC_DEPLOYMENT_URL` from `.env`. Additionally, `.env.docker` contained a conflicting hardcoded value.

### Resolution
1. Added `env_file: - .env` to the dashboard service in `docker-compose.yml`
2. Removed the conflicting `NEXT_PUBLIC_DEPLOYMENT_URL=http://localhost:3210` line from `.env.docker`  
3. Performed clean restart of services (`docker-compose down` then `docker-compose up -d backend dashboard`)

### Verification
Dashboard now correctly displays the workspace URL: `https://convex-api--main--<workspace>--<owner>.coder.hahomelabs.com`

## Status: ✅ Complete

File uploads are now configured to use local storage, avoiding all S3 compatibility issues. The dashboard is properly connected to the backend through the Coder workspace URL structure with the correct deployment URL displayed.