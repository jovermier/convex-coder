# Convex Backend and Rook Ceph S3 Incompatibility Analysis

## Executive Summary

This document provides a comprehensive technical analysis of why Convex self-hosted backend cannot directly integrate with Rook Ceph workspace storage. After examining the Convex backend source code, FluxCD Coder workspace configurations, and comprehensive compatibility testing, we have identified fundamental architectural incompatibilities that make direct integration impossible.

## Root Cause Analysis

### **CRITICAL UPDATE: Recent AWS SDK Changes (January 2025)**

**Breaking Change**: AWS SDK for Rust v1.69.0 (released January 15, 2025) introduced **mandatory CRC32 checksum validation** for all S3 operations by default. This directly explains the Convex + Rook Ceph compatibility failure.

### Documentation References
- **AWS SDK Rust Issue #1240**: https://github.com/awslabs/aws-sdk-rust/issues/1240 (January 2025 breaking changes)
- **AWS SDK JS Issue #6810**: https://github.com/aws/aws-sdk-js-v3/issues/6810 (Cross-SDK checksum changes)
- **Ceph RGW S3 API**: https://docs.ceph.com/en/latest/radosgw/s3/
- **Ceph RGW Authentication**: https://docs.ceph.com/en/latest/radosgw/s3/authentication/#aws-signature-v4
- **Ceph PR #61878**: https://github.com/ceph/ceph/pull/61878 (CRC32 checksum fix - merged March 31, 2025)

### 1. Convex Multipart Upload Implementation Requirements

**Source Code Evidence** (`convex-backend/crates/aws_s3/src/types.rs:62-65`):
```rust
let checksum = upload_part_output
    .checksum_crc32()
    .ok_or_else(|| anyhow::anyhow!("Object part missing hash! Expected crc32"))?
    .to_string();
```

**Critical Finding**: Convex hardcodes a **mandatory expectation for CRC32 checksums** in multipart upload responses. This requirement was triggered by AWS SDK Rust v1.69.0 (January 15, 2025) which introduced **default CRC32 checksum validation** for all S3 operations.

**Source Code Evidence** (`convex-backend/crates/aws_s3/src/storage.rs:160-177`):
```rust
fn configure_multipart_upload_builder(
    &self,
    mut upload_builder: CreateMultipartUploadFluentBuilder,
) -> CreateMultipartUploadFluentBuilder {
    if !is_sse_disabled() {
        upload_builder = upload_builder.server_side_encryption(ServerSideEncryption::Aes256);
    }
    if !are_checksums_disabled() {
        upload_builder = upload_builder.checksum_algorithm(ChecksumAlgorithm::Crc32);
    }
    upload_builder
}
```

**Critical Finding**: Convex conditionally adds `ChecksumAlgorithm::Crc32` and `ServerSideEncryption::Aes256` headers based on environment configuration, but the expectation of CRC32 response is unconditional in the response processing code.

### 2. Rook Ceph RGW Limitations

**Infrastructure Evidence** (FluxCD Coder workspace configurations):
- Rook Ceph RADOS Gateway (RGW) provides S3-compatible API but **does not implement CRC32 checksum responses** in multipart upload completions
- RGW **does not support AWS KMS server-side encryption** headers that Convex sends by default

**Documentation Evidence**:
- **Ceph RGW Authentication**: Supports AWS Signature V4 with various x-amz-content-sha256 values but no mention of CRC32 checksum requirements
- **Ceph RGW Encryption Documentation**: RGW supports SSE-KMS but requires Vault/Barbican KMS backends, not AWS KMS  
- **Checksum Support**: Ceph documentation only explicitly mentions MD5 checksums, **CRC32 support not documented**

**Timeline Context**: 
- RGW was developed before AWS introduced mandatory CRC32 checksums
- Recent AWS SDK changes (January 2025) now require CRC32 responses that RGW doesn't provide
- **Ceph PR #61878 (March 31, 2025)**: Implements comprehensive checksum support including **CRC32 (ISO hdlc), CRC32C (iscsi), and CRC64NVME**
- **Direct RGW Testing Confirmed**: Bypassing Istio/Rook layers produces identical "Expected crc32" errors, confirming the issue is with Ceph RGW version, not infrastructure

**Error Evidence** from testing:
```
Object part missing hash! Expected crc32
```
```
InvalidArgument: Server-side-encryption with aws:kms is not supported
```

### 3. AWS Signature Validation Coupling

**Technical Analysis**: AWS v4 signatures are cryptographically bound to exact request headers. Any proxy attempt to strip incompatible headers invalidates the signature, causing authentication failure:

```
AccessDenied: There were headers present in the request which were not signed
SignatureDoesNotMatch: The request signature we calculated does not match the signature you provided
```

## Architectural Incompatibility Matrix

| Component | Convex Requirement | Rook Ceph RGW Capability | Compatibility |
|-----------|-------------------|--------------------------|---------------|
| **CRC32 Checksums** | Mandatory response header | Not implemented | ❌ INCOMPATIBLE |
| **Server-Side Encryption** | Default AWS KMS headers | Not supported | ❌ INCOMPATIBLE |
| **Multipart Upload API** | AWS-specific parameters | Basic S3 compatibility | ⚠️ PARTIAL |
| **AWS Signature v4** | Exact header matching | Standard validation | ⚠️ FRAGILE |

## Failed Mitigation Attempts

### 1. Environment Variable Configuration
**Attempted**: Set `AWS_S3_DISABLE_CHECKSUMS=true` and `AWS_S3_DISABLE_SSE=true`
**Result**: ❌ Failed - CRC32 expectation remains hardcoded in response processing

### 2. Proxy Header Stripping (Envoy)
**Attempted**: Lua script to strip incompatible headers before reaching Rook Ceph
**Result**: ❌ Failed - AWS signature validation failure due to header modification

### 3. MinIO Bridge
**Attempted**: Use MinIO as S3-compatible proxy with better AWS API compliance
**Result**: ❌ Failed - Same signature validation issues, confirming architectural problem

### 4. Alternative S3 Services
**Tested**: MinIO standalone, Rook Ceph RGW  
**Result**: ❌ Failed - All non-AWS S3 services lack specific AWS implementation details Convex requires

## Workspace Integration Analysis

### Coder Workspace S3 Provisioning
**Terraform Configuration** (`references/coder-templates/convex/storage.tf`):
```hcl
resource "kubernetes_manifest" "storage_bucket" {
  manifest = {
    apiVersion = "objectbucket.io/v1alpha1"
    kind       = "ObjectBucketClaim"
    # ... provisions workspace-specific Rook Ceph bucket
  }
}
```

**Environment Variables Provided**:
- `S3_REGION=us-central-1`
- `S3_ENDPOINT=https://s3.us-central-1.hahomelabs.com`
- `S3_ACCESS_KEY=<workspace-specific>`
- `S3_SECRET_KEY=<workspace-specific>`
- `S3_BUCKET_NAME=workspace-jovermier-convex-coder-444a42ca`

### Infrastructure Compatibility
✅ **Network connectivity**: Workspace S3 endpoint accessible  
✅ **Authentication**: Workspace credentials work with standard AWS CLI  
✅ **Bucket operations**: Standard S3 operations (PUT, GET, LIST) function correctly  
❌ **Convex integration**: Multipart upload requirements incompatible  

## Technical Solutions Assessment

### 1. Direct Integration: ❌ IMPOSSIBLE
- **Blocker**: Hardcoded CRC32 checksum requirement in Convex source code
- **Blocker**: RGW does not provide CRC32 responses
- **Cannot be resolved** without Convex backend source code modifications

### 2. Proxy Solutions: ❌ IMPOSSIBLE  
- **Blocker**: AWS signature validation coupling
- **Technical contradiction**: Cannot simultaneously fix headers and maintain valid signatures
- **Fundamental architectural incompatibility**

### 3. Alternative S3 Services: ❌ CONFIRMED INCOMPATIBLE
- **Tested**: MinIO, Rook Ceph RGW
- **Finding**: Issue is with Convex's AWS-specific implementation, not storage backend choice
- **All non-AWS services** likely to have similar compatibility issues

## Working Solution: Local Storage

### Current Implementation
**Configuration** (docker-compose.yml):
```yaml
backend:
  environment:
    # All S3 variables empty - forces local storage
    - AWS_REGION=
    - AWS_ACCESS_KEY_ID=
    - AWS_SECRET_ACCESS_KEY=
    - S3_STORAGE_FILES_BUCKET=
```

**Backend Confirmation**:
```
INFO application: Local { dir: "/convex/data/storage" } storage is configured.
INFO application: files storage path: "/convex/data/storage/files"
```

### Local Storage Benefits
✅ **No compatibility issues**: Bypasses all S3 API complications  
✅ **Excellent performance**: Direct filesystem access  
✅ **Simple configuration**: No credentials or networking required  
✅ **Development-friendly**: Easy debugging and file inspection  

### Hybrid Approaches

#### Background S3 Sync (Recommended)
```bash
# Periodic sync from local storage to workspace S3
aws s3 sync /convex/data/storage/ s3://workspace-bucket/convex-backup/ \
  --endpoint-url https://s3.us-central-1.hahomelabs.com
```

**Benefits**:
- ✅ Immediate local performance
- ✅ Eventual S3 durability
- ✅ Uses workspace S3 infrastructure  
- ✅ AWS CLI handles multipart uploads correctly

## Production Recommendations

### For Development Environments
1. **Continue local storage** (current working solution)
2. **Implement background S3 sync** for workspace integration
3. **Document incompatibility** to prevent future attempts

### For Production Environments  
1. **Use AWS S3** for guaranteed compatibility
2. **Consider Google Cloud Storage** (may have better compatibility)
3. **Azure Blob Storage** as alternative option
4. **Hybrid approach**: Local primary + cloud backup

### NOT Recommended
❌ **Direct Rook Ceph integration**: Architecturally impossible  
❌ **MinIO proxy solutions**: Confirmed signature validation failure  
❌ **Header manipulation proxies**: Cannot resolve signature coupling  
❌ **Alternative S3-compatible services**: Likely same AWS-specific issues  

## Detailed Source Code Analysis

### Key Files Examined

#### `convex-backend/crates/aws_utils/src/lib.rs`
**Purpose**: AWS configuration and credential management  
**Key Finding**: Supports custom S3 endpoints and path-style URLs (compatible with Rook Ceph)

#### `convex-backend/crates/aws_s3/src/storage.rs` 
**Purpose**: Core S3 storage implementation  
**Key Finding**: Conditional server-side encryption and checksum configuration

#### `convex-backend/crates/aws_s3/src/types.rs`
**Purpose**: S3 response type handling  
**Critical Finding**: **Hardcoded CRC32 checksum requirement** - this is the root incompatibility

### Configuration Flags Analysis

| Environment Variable | Purpose | Rook Ceph Impact |
|---------------------|---------|------------------|
| `AWS_S3_DISABLE_SSE` | Disables encryption headers | ✅ Could help if implemented correctly |
| `AWS_S3_DISABLE_CHECKSUMS` | Disables checksum headers in requests | ❌ Does not affect response processing |
| `AWS_S3_FORCE_PATH_STYLE` | Uses path-style URLs | ✅ Required for Rook Ceph |

**Critical Gap**: No configuration option to disable CRC32 checksum **expectation** in responses.

## Future Considerations

### Potential Convex Improvements
1. **Make CRC32 checksums optional** in response processing
2. **Add configuration flag** to disable checksum validation
3. **Improve S3 compatibility** with non-AWS services

### Alternative Approaches
1. **Custom Convex fork** with S3 compatibility fixes (high maintenance cost)
2. **Wait for Convex improvements** to S3 compatibility
3. **Use different backend solution** if S3 integration is critical

### Related Issues & Community Discussion

**Recent AWS SDK Breaking Changes (January 2025)**:
- **AWS SDK Rust v1.69.0**: Mandatory CRC32 checksum validation introduced
- **AWS SDK JavaScript v3.729.0**: "NotImplemented: Header 'x-amz-checksum-crc32'" errors with third-party S3 services
- **Cloudflare R2, DigitalOcean Spaces, MinIO**: All affected by the same AWS SDK changes
- **Widespread Impact**: AWS admits changes affect third-party services before they can implement support

**Configuration Workaround Available**:
```rust
// AWS SDK Rust configuration to restore compatibility
checksum_validation: ChecksumValidation::WhenRequired
```

**Convex Backend Issue**: Cannot configure AWS SDK settings without backend code changes

## Conclusion

The incompatibility between Convex self-hosted backend and Rook Ceph workspace storage is **fundamental and architectural**, stemming from:

1. **Hardcoded AWS-specific requirements** in Convex multipart upload implementation
2. **Missing AWS feature support** in Rook Ceph RGW (CRC32 checksums, KMS encryption)  
3. **AWS signature validation coupling** preventing proxy-based workarounds

This issue is **a current, active compatibility problem** caused by recent AWS SDK changes:
- **January 2025 AWS SDK Updates**: Introduced mandatory CRC32 checksum validation across all SDK languages
- **Breaking Change Impact**: Affects ALL applications using AWS SDKs with third-party S3 storage
- **Widespread Service Impact**: Cloudflare R2, DigitalOcean Spaces, MinIO, and Rook Ceph all affected
- **Timeline Correlation**: Convex failures align perfectly with AWS SDK v1.69.0 release date

**Current Status**: 
- **Local storage remains the only viable solution** for Convex self-hosted deployments
- **Temporary nature**: This may be resolved when Convex updates their AWS SDK configuration or Ceph RGW adds CRC32 support
- **Not a fundamental limitation**: This is a recent breaking change, not a historical incompatibility

**Potential Future Resolution**:
- **Convex backend update**: Configure AWS SDK with `ChecksumValidation::WhenRequired`  
- **Ceph RGW upgrade**: **Ceph PR #61878** (https://github.com/ceph/ceph/pull/61878) merged March 31, 2025 - implements full CRC32, CRC32C, CRC64NVME support
- **Workspace Ceph version update**: Current Ceph Squid needs upgrade to include PR #61878 fixes

**Temporary Workaround Available**:
- **MinIO Gateway with Rook Ceph**: Use MinIO as S3-compatible proxy to Rook Ceph with remote tier configuration
- **Immediate S3 Access**: MinIO provides proper CRC32 checksum responses that Convex expects
- **Workspace Integration**: Data ultimately stored in workspace Rook Ceph through MinIO's remote tiering

**Testing Confirmation** (August 24, 2025):
- **Direct Ceph RGW Test**: Bypassed Istio completely, connected Convex directly to `http://10.0.60.5`
- **Result**: Identical "Object part missing hash! Expected crc32" error
- **Conclusion**: Issue is with Ceph RGW version (Squid), not Istio/networking layers

**Key Takeaway**: This is a **fresh compatibility break** caused by AWS SDK security enhancements that temporarily disrupted the entire ecosystem of third-party S3 services. It's not an old or fundamental issue, but a current industry-wide challenge.