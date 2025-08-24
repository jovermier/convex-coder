# Convex Backend Environment Variables Reference

This document provides a comprehensive list of all environment variables that can be configured in **Convex backend deployments**, based on analysis of the official Convex backend source code.

**Note**: This is reference documentation for Convex backend configuration options, not our specific project's environment variables. For workspace-specific environment variables used in this project, see the "Environment Integration" section in `CLAUDE.md`.

## Core Backend Configuration

### Instance & Security

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `INSTANCE_NAME` | Instance name for the backend | `dev` | No |
| `INSTANCE_SECRET` | Instance secret for the backend | `dev-secret` | No |
| `CONVEX_OVERRIDE_ACCESS_TOKEN` | Access token override for production provisioning | - | Production only |
| `DISABLE_BEACON` | Disables telemetry beacon | `false` | No |
| `REDACT_LOGS_TO_CLIENT` | Redacts logs sent to clients | `false` | No |

### URLs & Origins

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CONVEX_CLOUD_ORIGIN` | Origin URL for Convex client API | `http://127.0.0.1:3210` | No |
| `CONVEX_SITE_ORIGIN` | Origin URL for Convex HTTP Actions | `http://127.0.0.1:3211` | No |
| `CONVEX_CLOUD_URL` | Internal environment variable for cloud URL | - | Internal |
| `CONVEX_SITE_URL` | Internal environment variable for site URL | - | Internal |

### Database Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `POSTGRES_URL` | PostgreSQL connection string | - | If using PostgreSQL |
| `MYSQL_URL` | MySQL connection string | - | If using MySQL |
| `DATABASE_URL` | Database connection string (deprecated) | - | Deprecated |
| `DO_NOT_REQUIRE_SSL` | Disables SSL requirement for database connections | `false` | No |

### AWS & S3 Storage

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `AWS_REGION` | AWS region | - | If using S3 |
| `AWS_ACCESS_KEY_ID` | AWS access key | - | If using S3 |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - | If using S3 |
| `AWS_SESSION_TOKEN` | AWS session token | - | If using temporary credentials |
| `AWS_S3_FORCE_PATH_STYLE` | Forces path-style S3 URLs | `false` | No |
| `S3_ENDPOINT_URL` | Custom S3 endpoint URL | - | For S3-compatible services |
| `S3_STORAGE_EXPORTS_BUCKET` | S3 bucket for exports | - | If using S3 |
| `S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET` | S3 bucket for snapshot imports | - | If using S3 |
| `S3_STORAGE_MODULES_BUCKET` | S3 bucket for modules | - | If using S3 |
| `S3_STORAGE_FILES_BUCKET` | S3 bucket for user files | - | If using S3 |
| `S3_STORAGE_SEARCH_BUCKET` | S3 bucket for search indexes | - | If using S3 |

### Networking & Ports

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Main backend port | `3210` | No |
| `SITE_PROXY_PORT` | HTTP Actions port | `3211` | No |
| `DASHBOARD_PORT` | Dashboard port | `6791` | No |

## Development & Runtime Configuration

### Logging & Debugging

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `RUST_LOG` | Rust logging level | `info` | No |
| `RUST_BACKTRACE` | Enable Rust backtraces | - | No |
| `LOG_FORMAT` | Log format (json, compact, or default) | default | No |
| `NO_COLOR` | Disable colored output | - | No |
| `CONVEX_TRACE_FILE` | File for trace output | - | No |
| `TZ` | Timezone (should be UTC) | `UTC` | No |

### Runtime Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CONVEX_RELEASE_VERSION_DEV` | Development release version | - | No |
| `CONVEX_SITE` | Site identifier for metrics | - | No |
| `NOMAD_ALLOC_ID` | Production environment detection | - | Internal |
| `ACTIONS_USER_TIMEOUT_SECS` | Timeout for user actions | - | No |

### V8 & Isolate Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ISOLATE_V8_FLAGS` | V8 flags for isolate | - | No |
| `NODE_ENV` | Node.js environment | - | No |

## Client & Frontend Configuration

### Client Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CONVEX_URL` | Convex deployment URL for client | - | Yes (client) |
| `VITE_CONVEX_URL` | Vite-specific Convex URL | - | Vite projects |
| `CONVEX_DEPLOY_KEY` | Deployment key (cloud) | - | Cloud deployments |
| `CONVEX_SELF_HOSTED_URL` | Self-hosted backend URL | - | Self-hosted |
| `CONVEX_SELF_HOSTED_ADMIN_KEY` | Self-hosted admin key | - | Self-hosted |

### Dashboard Configuration

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_DEPLOYMENT_URL` | Next.js public deployment URL | - | Dashboard |
| `NEXT_PUBLIC_ADMIN_KEY` | Next.js public admin key | - | No |
| `NEXT_PUBLIC_DEFAULT_LIST_DEPLOYMENTS_API_PORT` | Default API port | `6791` | No |
| `NEXT_PUBLIC_HIDE_HEADER` | Hide dashboard header | `false` | No |
| `BUILD_TYPE` | Build type (export or build) | `build` | No |
| `EMBEDDED_CORS_HEADERS` | Embedded CORS headers | - | No |

## Testing & Development

### Testing Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CONVEX_PROPTEST_MULTIPLIER` | Multiplier for property test cases | `1` | No |
| `DATASET` | Path to test dataset | - | Testing only |
| `QUERY` | Test query string | - | Testing only |
| `MAX_TERMS` | Maximum search terms | - | Testing only |
| `MAX_RESULTS` | Maximum search results | - | Testing only |
| `BATCH_SIZE` | Batch size for tests | `10` | No |
| `BUF_SIZE` | Buffer size for tests | `10` | No |
| `SKIP_INSTANCE_SECRET_TESTS` | Skip instance secret tests | `false` | No |

### Database Testing

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CI_PGUSER` | PostgreSQL user for CI | `$USER` | CI only |
| `CI_PGPASSWORD` | PostgreSQL password for CI | - | CI only |
| `MYSQL_ALLOW_EMPTY_PASSWORD` | Allow empty MySQL password | `false` | Testing only |
| `MYSQL_ROOT_PASSWORD` | MySQL root password | - | Testing only |

### Build & Development

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `CARGO_WORKSPACE_ROOT` | Cargo workspace root | - | Build only |
| `OUT_DIR` | Build output directory | - | Build only |
| `VERGEN_GIT_SHA` | Git commit SHA | - | Build only |
| `VERGEN_GIT_COMMIT_TIMESTAMP` | Git commit timestamp | - | Build only |

## Special & Advanced Configuration

### SSL & Security

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SSLKEYLOGFILE` | SSL key log file for debugging | - | Debug only |

### Debugging & Profiling

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ELLE_DOT_PATH` | Path for Elle verification output | - | Debug only |

### System Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `USER` | System user | - | System |

## Usage Examples

### Self-Hosted with PostgreSQL

```bash
# Basic self-hosted setup
export INSTANCE_NAME="my-convex-instance"
export INSTANCE_SECRET="your-secure-secret"
export POSTGRES_URL="postgresql://user:password@localhost:5432"
export CONVEX_CLOUD_ORIGIN="https://api.mydomain.com"
export CONVEX_SITE_ORIGIN="https://mydomain.com"
```

### Self-Hosted with S3 Storage

```bash
# S3 storage configuration
export AWS_REGION="us-west-2"
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export S3_STORAGE_EXPORTS_BUCKET="convex-exports"
export S3_STORAGE_FILES_BUCKET="convex-files"
export S3_STORAGE_MODULES_BUCKET="convex-modules"
export S3_STORAGE_SEARCH_BUCKET="convex-search"
export S3_STORAGE_SNAPSHOT_IMPORTS_BUCKET="convex-imports"
```

### Client Configuration

```bash
# For Vite-based projects
VITE_CONVEX_URL="https://api.mydomain.com"

# For Next.js projects
NEXT_PUBLIC_DEPLOYMENT_URL="https://api.mydomain.com"

# For self-hosted clients
CONVEX_SELF_HOSTED_URL="https://api.mydomain.com"
CONVEX_SELF_HOSTED_ADMIN_KEY="your-admin-key"
```

### Development & Debugging

```bash
# Enable debug logging
export RUST_LOG="debug"
export RUST_BACKTRACE="1"
export LOG_FORMAT="json"

# V8 debugging
export ISOLATE_V8_FLAGS="--trace-opt --trace-deopt"
```

## Notes

- **Security**: Never commit sensitive environment variables like secrets and keys to version control
- **Production**: Always use `REDACT_LOGS_TO_CLIENT=true` in production deployments
- **SSL**: Database SSL is required by default; use `DO_NOT_REQUIRE_SSL=true` only for testing
- **Deprecated**: `DATABASE_URL` is deprecated; use `POSTGRES_URL` or `MYSQL_URL` instead
- **Telemetry**: Set `DISABLE_BEACON=true` to disable telemetry collection

## References

This documentation is based on analysis of the official Convex backend source code. For the most up-to-date information, refer to the [official Convex documentation](https://docs.convex.dev/).