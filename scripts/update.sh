#!/bin/bash

set -e

echo "🔄 Updating Railover to the latest version..."
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_banner() {
    echo -e "${BLUE}$1${NC}"
}

if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_banner "╔════════════════════════════════════════════╗"
print_banner "║         Railover Update Script             ║"
print_banner "╚════════════════════════════════════════════╝"
echo ""

if ! docker ps --format '{{.Names}}' | grep -q "^captain-captain$"; then
    print_error "Railover container is not running!"
    print_info "Start it first with: docker start captain-captain"
    exit 1
fi

print_info "Current Railover version:"
docker exec captain-captain node -e "console.log(require('/usr/src/app/built/utils/CaptainConstants').default.configs.version)" 2>/dev/null || echo "Unable to detect version"
echo ""

print_info "Backing up current configuration..."
BACKUP_DIR="/opt/railover/backups"
BACKUP_FILE="$BACKUP_DIR/pre-update-$(date +%Y%m%d-%H%M%S).tar.gz"

mkdir -p "$BACKUP_DIR"

if tar czf "$BACKUP_FILE" /opt/railover/data 2>/dev/null; then
    print_success "Backup created: $BACKUP_FILE"
else
    print_error "Backup failed! Aborting update."
    exit 1
fi

print_info "Pulling latest Railover image..."
if docker pull ilyosdev/railover:latest; then
    print_success "Latest image pulled successfully"
else
    print_error "Failed to pull latest image"
    exit 1
fi

print_info "Stopping current Railover container..."
docker stop captain-captain

print_info "Removing old container..."
docker rm captain-captain

print_info "Starting updated Railover container..."
docker run -d \
    --name captain-captain \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    -p 3000:3000 \
    -p 996:996 \
    -p 7946:7946 \
    -p 4789:4789 \
    -p 2377:2377 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /opt/railover/data:/captain/data \
    ilyosdev/railover:latest

print_info "Waiting for Railover to start..."
for i in {1..30}; do
    if docker ps --format '{{.Names}}' | grep -q "^captain-captain$"; then
        sleep 3
        break
    fi
    sleep 1
done

if docker ps --format '{{.Names}}' | grep -q "^captain-captain$"; then
    echo ""
    print_banner "=========================================="
    print_banner "   ✅ Railover Updated Successfully!"
    print_banner "=========================================="
    echo ""
    
    print_info "New version:"
    docker exec captain-captain node -e "console.log(require('/usr/src/app/built/utils/CaptainConstants').default.configs.version)" 2>/dev/null || echo "2.0.0+"
    
    echo ""
    print_info "Backup saved at: $BACKUP_FILE"
    print_info "Dashboard: http://$(curl -s -4 ifconfig.me):3000"
    echo ""
    print_success "Update complete! 🎉"
else
    print_error "Update failed! Container is not running."
    print_info "Restoring from backup..."
    
    docker stop captain-captain 2>/dev/null || true
    docker rm captain-captain 2>/dev/null || true
    
    tar xzf "$BACKUP_FILE" -C /
    
    docker run -d \
        --name captain-captain \
        --restart unless-stopped \
        -p 80:80 -p 443:443 -p 3000:3000 \
        -p 996:996 -p 7946:7946 -p 4789:4789 -p 2377:2377 \
        -v /var/run/docker.sock:/var/run/docker.sock \
        -v /opt/railover/data:/captain/data \
        ilyosdev/railover:latest
    
    print_error "Restored previous version from backup"
    exit 1
fi

print_info "Cleaning up old Docker images..."
docker image prune -f

echo ""
print_success "All done! Happy deploying! 🚀"
