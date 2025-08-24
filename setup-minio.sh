#!/bin/bash
set -e

echo "=== Setting up MinIO Gateway for Convex + Ceph Integration ==="

# Wait for MinIO to be ready
echo "Waiting for MinIO to be ready..."
until curl -s http://localhost:9000/minio/health/live > /dev/null; do
  echo "Waiting for MinIO..."
  sleep 2
done

echo "MinIO is ready!"

# Get MinIO credentials from .env.docker
MINIO_USER=$(grep MINIO_ROOT_USER .env.docker | cut -d'=' -f2)
MINIO_PASS=$(grep MINIO_ROOT_PASSWORD .env.docker | cut -d'=' -f2)

# Configure MinIO client
echo "Configuring MinIO client..."
docker exec convex-coder-minio-1 mc alias set local http://localhost:9000 "$MINIO_USER" "$MINIO_PASS"

# Create required buckets for Convex
echo "Creating Convex buckets..."
docker exec convex-coder-minio-1 mc mb local/convex-files --ignore-existing
docker exec convex-coder-minio-1 mc mb local/convex-exports --ignore-existing
docker exec convex-coder-minio-1 mc mb local/convex-snapshot-imports --ignore-existing
docker exec convex-coder-minio-1 mc mb local/convex-modules --ignore-existing
docker exec convex-coder-minio-1 mc mb local/convex-search --ignore-existing

echo "Buckets created successfully!"

# Check if workspace S3 credentials are available for remote tier setup
if [[ -n "$S3_ACCESS_KEY" && -n "$S3_SECRET_KEY" && -n "$S3_ENDPOINT" ]]; then
  echo "Setting up Ceph RGW as remote tier..."
  
  # Configure Rook Ceph as remote tier in MinIO
  docker exec convex-coder-minio-1 mc admin tier add s3 local CEPH \
    --endpoint "$S3_ENDPOINT" \
    --access-key "$S3_ACCESS_KEY" \
    --secret-key "$S3_SECRET_KEY" \
    --bucket "${S3_BUCKET_NAME}" || echo "Remote tier already exists or failed to add"

  # Set lifecycle policy for immediate tiering to Ceph
  echo "Setting up lifecycle policies for remote tiering..."
  docker exec convex-coder-minio-1 mc ilm add --transition-days 1 --transition-tier CEPH local/convex-files || echo "Lifecycle policy already exists"
  docker exec convex-coder-minio-1 mc ilm add --transition-days 1 --transition-tier CEPH local/convex-exports || echo "Lifecycle policy already exists"
  
  echo "Remote tier configuration completed!"
else
  echo "Workspace S3 credentials not available - skipping remote tier setup"
  echo "Files will be stored locally in MinIO"
fi

echo "=== MinIO Gateway Setup Complete ==="
echo "MinIO Console: http://localhost:9001 ($MINIO_USER/<password>)"
echo "S3 API Endpoint: http://localhost:9000"
echo "Credentials are stored in .env.docker file"