#!/bin/bash

# RAILOVER Local Development Script
# This runs RAILOVER backend in development mode

echo "🚂 Starting RAILOVER Backend..."
echo ""

# Check if already running
if docker ps | grep -q "railover-dev"; then
    echo "⚠️  RAILOVER is already running. Stopping..."
    docker stop railover-dev 2>/dev/null
    docker rm railover-dev 2>/dev/null
fi

# Start RAILOVER
docker run -d \
    --name railover-dev \
    -p 3000:3000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$(pwd)/built:/usr/src/app/built" \
    -v "$(pwd)/src:/usr/src/app/src" \
    -e NODE_ENV=development \
    -e CAPTAIN_DOCKER_API=unix:///var/run/docker.sock \
    node:18-alpine \
    sh -c "cd /usr/src/app && npm install && node built/index.js"

echo ""
echo "✅ RAILOVER backend starting..."
echo "📡 API: http://localhost:3000"
echo ""
echo "📋 View logs:"
echo "   docker logs -f railover-dev"
echo ""
echo "🛑 Stop:"
echo "   docker stop railover-dev"
