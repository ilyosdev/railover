#!/bin/bash

# Simple RAILOVER Local Dev Runner
echo "🚂 RAILOVER - Railway-like PaaS Platform"
echo "========================================"
echo ""

cd "$(dirname "$0")/.."

# Check if built directory exists
if [ ! -d "built" ]; then
    echo "❌ Built directory not found. Running build..."
    npm run build
fi

# Run RAILOVER backend directly
echo "🚀 Starting RAILOVER API on port 3000..."
echo ""

PORT=3000 \
CAPTAIN_DOCKER_API=unix:///var/run/docker.sock \
NODE_ENV=development \
node built/index.js

