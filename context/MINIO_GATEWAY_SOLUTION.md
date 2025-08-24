# MinIO Gateway Solution for Convex + Rook Ceph Integration

## Overview

This document describes the **temporary workaround** for integrating Convex self-hosted backend with Rook Ceph workspace storage using MinIO as an S3-compatible gateway.

## Problem Context (August 2025)

**Recent AWS SDK Changes**: AWS SDK for Rust v1.69.0 (January 15, 2025) introduced mandatory CRC32 checksum validation for all S3 operations, breaking compatibility with third-party S3 services that don't provide CRC32 checksums in responses.

**Direct Testing Confirmation (August 24, 2025)**: Connected Convex directly to Ceph RGW (`http://10.0.60.5`) bypassing all Istio/Rook layers, confirmed identical "Expected crc32" errors, proving the issue is with Ceph RGW version.

**Impact on Convex + Rook Ceph**:

- Convex expects CRC32 checksums in multipart upload responses
- Rook Ceph RGW doesn't provide CRC32 checksums
- Direct integration fails with "Object part missing hash! Expected crc32"

## MinIO Gateway Solution

### Architecture

```
┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
│  Convex Backend │───▶│ MinIO Gateway│───▶│ Rook Ceph RGW   │
│                 │    │              │    │ (Workspace S3)  │
│ Expects CRC32   │    │ Provides     │    │ Ultimate Storage│
│ checksums       │    │ CRC32 responses  │    │                 │
└─────────────────┘    └──────────────┘    └─────────────────┘
```

### Benefits

✅ **Immediate Compatibility**: MinIO provides CRC32 checksums that Convex requires
✅ **Workspace Integration**: Data ultimately stored in workspace Rook Ceph
✅ **No Application Changes**: Convex sees standard S3 API
✅ **Proven Solution**: MinIO widely used as S3 compatibility layer
✅ **Remote Tier Support**: MinIO can tier data to Rook Ceph automatically

## Implementation

### 1. Docker Compose Configuration

```yaml
version: "3.8"

services:
  # MinIO S3-compatible gateway
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000" # S3 API
      - "9001:9001" # Web Console
    environment:
      - MINIO_ROOT_USER=minioadmin
      - MINIO_ROOT_PASSWORD=minioadmin123
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s
      timeout: 20s
      retries: 3

  # Convex backend configured to use MinIO
  backend:
    image: convex/backend:latest
    depends_on:
      minio:
        condition: service_healthy
    environment:
      # S3 configuration pointing to MinIO
      - AWS_REGION=us-east-1
      - AWS_ACCESS_KEY_ID=minioadmin
      - AWS_SECRET_ACCESS_KEY=minioadmin123
      - S3_ENDPOINT_URL=http://minio:9000
      - AWS_S3_FORCE_PATH_STYLE=true

      # S3 bucket configuration
      - S3_STORAGE_FILES_BUCKET=convex-files
      - S3_STORAGE_EXPORTS_BUCKET=convex-exports
      - S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET=convex-snapshot-imports
      - S3_STORAGE_MODULES_BUCKET=convex-modules
      - S3_STORAGE_SEARCH_BUCKET=convex-search

volumes:
  minio_data:
```

### 2. MinIO Bucket Setup

```bash
# Create required buckets for Convex
docker exec minio-container mc alias set local http://localhost:9000 minioadmin minioadmin123

# Create all required buckets
docker exec minio-container mc mb local/convex-files
docker exec minio-container mc mb local/convex-exports
docker exec minio-container mc mb local/convex-snapshot-imports
docker exec minio-container mc mb local/convex-modules
docker exec minio-container mc mb local/convex-search
```

### 3. Rook Ceph Remote Tier Configuration (Optional)

For direct workspace S3 integration, configure MinIO remote tier to Rook Ceph:

```bash
# Configure Rook Ceph as remote tier in MinIO
docker exec minio-container mc admin tier add s3 local CEPH \
  --endpoint "https://s3.us-central-1.hahomelabs.com" \
  --access-key "${S3_ACCESS_KEY}" \
  --secret-key "${S3_SECRET_KEY}" \
  --bucket "workspace-jovermier-convex-coder-444a42ca"

# Set lifecycle policy for immediate tiering
docker exec minio-container mc ilm add --transition-days 0 --transition-tier CEPH local/convex-files
```

## Testing and Verification

### 1. MinIO Health Check

```bash
# Check MinIO service status
curl http://localhost:9000/minio/health/live

# List buckets
docker exec minio-container mc ls local/

# Web console access
open http://localhost:9001
```

### 2. Convex Integration Test

```bash
# Check Convex backend logs for S3 configuration
docker logs backend-container | grep -i "S3"

# Expected log output:
# INFO application: S3 { s3_prefix: "convex-workspace-xxx/" } storage is configured.
```

### 3. File Upload Test

1. Access Convex dashboard
2. Navigate to file upload section
3. Upload a test file
4. Verify file appears in MinIO console
5. Check if file is tiered to Rook Ceph (if configured)

## Advantages Over Previous Solutions

| Solution             | AWS SDK Compatibility | Workspace Integration | Complexity |
| -------------------- | --------------------- | --------------------- | ---------- |
| **Direct Rook Ceph** | ❌ Fails (No CRC32)   | ✅ Native             | 🟢 Low     |
| **Envoy Proxy**      | ❌ Signature Issues   | ✅ Native             | 🔴 High    |
| **Local Storage**    | ✅ Works              | ❌ None               | 🟢 Low     |
| **MinIO Gateway**    | ✅ Works              | ✅ Via Remote Tier    | 🟡 Medium  |

## Current Status and Timeline

**Temporary Solution**: This approach works around the January 2025 AWS SDK breaking changes
**Expected Duration**: Until one of the following occurs:

- Convex configures AWS SDK with `ChecksumValidation::WhenRequired`
- **Workspace Ceph upgrade**: Ceph PR #61878 (https://github.com/ceph/ceph/pull/61878) merged March 31, 2025 with full CRC32/CRC32C/CRC64NVME support
- Current Ceph Squid version needs upgrade to include checksum fixes

**Monitoring**: Watch for updates to:

- Convex backend repository for AWS SDK configuration changes
- Ceph releases for enhanced S3 compatibility features
- AWS SDK documentation for third-party service compatibility guidance

## Configuration Files

### Environment Variables (.env)

```bash
# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123

# Convex S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin123
S3_ENDPOINT_URL=http://minio:9000
AWS_S3_FORCE_PATH_STYLE=true

# Bucket Names
S3_STORAGE_FILES_BUCKET=convex-files
S3_STORAGE_EXPORTS_BUCKET=convex-exports
S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET=convex-snapshot-imports
S3_STORAGE_MODULES_BUCKET=convex-modules
S3_STORAGE_SEARCH_BUCKET=convex-search

# Workspace Rook Ceph (for remote tier)
WORKSPACE_S3_ENDPOINT=https://s3.us-central-1.hahomelabs.com
WORKSPACE_S3_ACCESS_KEY=${S3_ACCESS_KEY}
WORKSPACE_S3_SECRET_KEY=${S3_SECRET_KEY}
WORKSPACE_S3_BUCKET=workspace-jovermier-convex-coder-444a42ca
```

## Troubleshooting

### Common Issues

1. **MinIO startup failures**: Check port conflicts (9000, 9001)
2. **Bucket creation errors**: Verify MinIO credentials and network connectivity
3. **Convex connection failures**: Ensure `S3_ENDPOINT_URL` uses container networking
4. **Remote tier setup**: Verify workspace S3 credentials and endpoint accessibility

### Verification Commands

```bash
# Test MinIO S3 API
aws --endpoint-url http://localhost:9000 s3 ls s3://convex-files/

# Check MinIO logs
docker logs minio-container

# Verify remote tier configuration
docker exec minio-container mc admin tier list local

# Test file operations
echo "test" | docker exec -i minio-container mc pipe local/convex-files/test.txt
```

## Conclusion

The MinIO gateway solution provides an effective temporary workaround for the AWS SDK compatibility issues between Convex and Rook Ceph. While adding an additional service layer, it enables immediate S3 functionality with workspace integration through remote tiering.

This solution should remain viable until the underlying AWS SDK compatibility issues are resolved at the application or infrastructure level.
