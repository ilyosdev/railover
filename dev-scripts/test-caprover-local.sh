#!/bin/bash
# Test CapRover locally for migration testing

set -e

IMAGE="caprover/caprover:latest"
CONTAINER_NAME="test-captain"
DATA_DIR="./test-captain-data"
PORT_HTTP=8080
PORT_API=3080

echo "==================================="
echo "CapRover Local Test Setup"
echo "==================================="
echo ""
echo "This script will:"
echo "1. Pull latest CapRover image"
echo "2. Create isolated test environment"
echo "3. Start CapRover for migration testing"
echo ""

# Create test data directory
mkdir -p "$DATA_DIR"

# Check if container already exists
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Stopping existing container..."
    docker stop "$CONTAINER_NAME" || true
    docker rm "$CONTAINER_NAME" || true
fi

# Pull latest CapRover image
echo "Pulling CapRover image..."
docker pull "$IMAGE"

# Start CapRover
echo "Starting CapRover..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p "${PORT_HTTP}:80" \
  -p "${PORT_API}:3000" \
  -v "$(pwd)/${DATA_DIR}:/captain-data" \
  --cap-add SYS_ADMIN \
  "$IMAGE"

# Wait for container to be ready
echo ""
echo "Waiting for CapRover to start..."
sleep 5

# Check if container is running
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    echo "ERROR: Container failed to start!"
    echo "Check logs with: docker logs $CONTAINER_NAME"
    exit 1
fi

echo ""
echo "==================================="
echo "CapRover is running!"
echo "==================================="
echo ""
echo "Dashboard:  http://localhost:${PORT_HTTP}"
echo "API:        http://localhost:${PORT_API}"
echo "Data:       $(pwd)/${DATA_DIR}"
echo ""
echo "Default login:"
echo "  Password: captain42"
echo ""
echo "Useful commands:"
echo "  View logs:   docker logs -f $CONTAINER_NAME"
echo "  Stop:        docker stop $CONTAINER_NAME"
echo "  Remove:      docker rm $CONTAINER_NAME"
echo ""
echo "After testing, run migration:"
echo "  docker stop $CONTAINER_NAME"
echo "  Then follow MIGRATION_FROM_CAPROVER.md guide"
