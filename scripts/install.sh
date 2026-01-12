#!/bin/bash

set -e

echo "🚀 Installing Railover VDS PaaS on your server..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root (use sudo)"
    exit 1
fi

print_banner "╔════════════════════════════════════════════╗"
print_banner "║         Railover VDS PaaS Installer        ║"
print_banner "║  Deploy like Railway for $50/month         ║"
print_banner "╚════════════════════════════════════════════╝"
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
else
    print_error "Cannot detect OS"
    exit 1
fi

print_info "Detected OS: $OS $OS_VERSION"

# Check system requirements
print_info "Checking system requirements..."

# Check RAM (minimum 2GB recommended)
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')
if [ "$TOTAL_RAM" -lt 2000 ]; then
    print_error "WARNING: Only ${TOTAL_RAM}MB RAM available. Minimum 2GB recommended."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "RAM: ${TOTAL_RAM}MB"
fi

# Check disk space (minimum 10GB)
DISK_SPACE=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$DISK_SPACE" -lt 10 ]; then
    print_error "WARNING: Only ${DISK_SPACE}GB disk space available. Minimum 10GB recommended."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "Disk space: ${DISK_SPACE}GB available"
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    print_info "Docker not found. Installing Docker..."
    
    case $OS in
        ubuntu|debian)
            # Update package index
            apt-get update
            
            # Install dependencies
            apt-get install -y \
                ca-certificates \
                curl \
                gnupg \
                lsb-release
            
            # Add Docker's official GPG key
            mkdir -p /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/$OS/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            
            # Set up repository
            echo \
              "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$OS \
              $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # Install Docker
            apt-get update
            apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        
        centos|rhel|fedora)
            yum install -y yum-utils
            yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
            ;;
        
        *)
            print_error "Unsupported OS: $OS"
            print_info "Please install Docker manually: https://docs.docker.com/engine/install/"
            exit 1
            ;;
    esac
    
    # Start Docker
    systemctl start docker
    systemctl enable docker
    
    print_success "Docker installed and started"
else
    print_success "Docker is already installed ($(docker --version))"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    print_info "Docker Compose not found. Installing..."
    
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose installed (${DOCKER_COMPOSE_VERSION})"
else
    print_success "Docker Compose is already installed"
fi

# Initialize Docker Swarm if not already initialized
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    print_info "Initializing Docker Swarm..."
    docker swarm init --advertise-addr $(hostname -I | awk '{print $1}') || docker swarm init
    print_success "Docker Swarm initialized"
else
    print_success "Docker Swarm is already active"
fi

# Create data directory
print_info "Creating Railover data directory..."
mkdir -p /opt/railover/data
print_success "Data directory created: /opt/railover/data"

# Generate random password if not provided
if [ -z "$RAILOVER_PASSWORD" ]; then
    RAILOVER_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
    GENERATED_PASSWORD=true
else
    GENERATED_PASSWORD=false
fi

# Get server IP
print_info "Detecting server IP address..."
SERVER_IP=$(curl -s -4 --max-time 5 ifconfig.me || curl -s -4 --max-time 5 icanhazip.com || hostname -I | awk '{print $1}')

if [ -z "$SERVER_IP" ]; then
    SERVER_IP="<your-server-ip>"
    print_error "Could not detect server IP automatically"
else
    print_success "Server IP: $SERVER_IP"
fi

# Stop existing Railover container if exists
if docker ps -a --format '{{.Names}}' | grep -q "^captain-captain$"; then
    print_info "Stopping existing Railover container..."
    docker stop captain-captain 2>/dev/null || true
    docker rm captain-captain 2>/dev/null || true
    print_success "Existing container removed"
fi

# Pull latest Railover image
print_info "Pulling latest Railover image..."
docker pull ilyosdev/railover:latest
print_success "Image pulled successfully"

# Run Railover container
print_info "Starting Railover container..."
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
    -e CAPTAIN_ADMIN_PASSWORD="$RAILOVER_PASSWORD" \
    ilyosdev/railover:latest

# Wait for container to start
print_info "Waiting for Railover to start (this may take 30 seconds)..."
for i in {1..30}; do
    if docker ps --format '{{.Names}}' | grep -q "^captain-captain$"; then
        # Wait a bit more for the service to be fully ready
        sleep 5
        break
    fi
    sleep 1
done

# Check if container is running
if docker ps --format '{{.Names}}' | grep -q "^captain-captain$"; then
    print_success "Railover is running!"
    echo ""
    print_banner "=========================================="
    print_banner "   🎉 Railover Installation Complete!"
    print_banner "=========================================="
    echo ""
    
    if [ "$GENERATED_PASSWORD" = true ]; then
        echo -e "${YELLOW}📝 Admin Credentials:${NC}"
        echo "   URL:      http://$SERVER_IP:3000"
        echo "   Username: admin"
        echo "   Password: $RAILOVER_PASSWORD"
        echo ""
        echo -e "${RED}⚠️  IMPORTANT: Save this password! You won't see it again.${NC}"
        echo -e "${RED}⚠️  Change your password after first login!${NC}"
    else
        echo -e "${YELLOW}📝 Admin Dashboard:${NC}"
        echo "   URL:      http://$SERVER_IP:3000"
        echo "   Username: admin"
        echo "   Password: (your provided password)"
    fi
    
    echo ""
    echo -e "${YELLOW}🔒 Next Steps:${NC}"
    echo "   1. Open http://$SERVER_IP:3000 in your browser"
    echo "   2. Login with the credentials above"
    echo "   3. Configure your domain name for SSL"
    echo "   4. Start deploying your apps!"
    echo ""
    echo -e "${YELLOW}📊 Useful Commands:${NC}"
    echo "   View logs:       docker logs -f captain-captain"
    echo "   Restart:         docker restart captain-captain"
    echo "   Stop:            docker stop captain-captain"
    echo "   Start:           docker start captain-captain"
    echo "   Update:          docker pull ilyosdev/railover:latest && docker restart captain-captain"
    echo ""
    echo -e "${YELLOW}🔥 Firewall Configuration:${NC}"
    echo "   Make sure ports 80, 443, and 3000 are open in your firewall:"
    echo "   sudo ufw allow 80/tcp"
    echo "   sudo ufw allow 443/tcp"
    echo "   sudo ufw allow 3000/tcp"
    echo ""
    echo -e "${GREEN}Happy deploying! 🚀${NC}"
    echo ""
else
    print_error "Railover failed to start. Checking logs..."
    echo ""
    docker logs captain-captain
    echo ""
    print_info "Troubleshooting:"
    echo "   1. Check if ports are already in use: sudo netstat -tulpn | grep -E ':(80|443|3000)'"
    echo "   2. Check Docker logs: docker logs captain-captain"
    echo "   3. Try manual start: docker start captain-captain"
    echo "   4. Get help: https://github.com/ilyosdev/railover/issues"
    exit 1
fi
