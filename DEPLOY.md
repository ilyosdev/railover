# RAILOVER Deployment Guide

## Quick Deploy (Using CapRover Base + Your Frontend)

The fastest way to test RAILOVER is to use standard CapRover backend with your custom frontend.

### Step 1: Deploy Standard CapRover on VPS

SSH into your VPS and run:

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh

# Deploy CapRover
docker run -p 80:80 -p 443:443 -p 3000:3000 \
  -e ACCEPTED_TERMS=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /captain:/captain \
  caprover/caprover
```

Wait 60 seconds, then visit: `http://YOUR_SERVER_IP:3000`

Default password: `captain42`

---

## Full RAILOVER Deploy (Custom Backend + Frontend)

### Prerequisites

- Docker Hub account (or GitHub Container Registry)
- VPS with Docker installed

### Step 1: Build and Push RAILOVER Backend Image

On your local machine:

```bash
cd /Users/mac/Documents/my-products/railover

# Login to Docker Hub
docker login

# Build the image
docker build -f dockerfile-captain.release -t YOUR_DOCKERHUB_USERNAME/railover:latest .

# Push to registry
docker push YOUR_DOCKERHUB_USERNAME/railover:latest
```

### Step 2: Deploy on VPS

SSH into your VPS:

```bash
# Install Docker (if not already)
curl -fsSL https://get.docker.com | sh

# Pull and run RAILOVER
docker run -p 80:80 -p 443:443 -p 3000:3000 \
  -e ACCEPTED_TERMS=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /captain:/captain \
  YOUR_DOCKERHUB_USERNAME/railover:latest
```

### Step 3: Initial Setup

1. Wait 60 seconds for initialization
2. Visit `http://YOUR_SERVER_IP:3000`
3. Login with password: `captain42`
4. Change password immediately
5. Set up your root domain (e.g., `apps.yourdomain.com`)

---

## Deploy Custom Frontend

### Option A: Replace Frontend in Docker Image

Create a combined Dockerfile that includes your frontend build:

```dockerfile
FROM node:22-alpine as frontend-builder
WORKDIR /frontend
COPY ../railoover-frontend/package*.json ./
RUN npm ci
COPY ../railoover-frontend/ ./
RUN npm run build

FROM YOUR_DOCKERHUB_USERNAME/railover:latest
COPY --from=frontend-builder /frontend/build /usr/src/app/dist-frontend
```

### Option B: Deploy Frontend as Separate App

After RAILOVER is running, deploy your frontend as an app on RAILOVER itself:

1. Create new app called `dashboard`
2. Deploy your frontend build
3. Set custom domain

---

## Domain Setup

### Point Domain to Server

Add DNS A record:

```
*.apps.yourdomain.com  →  YOUR_SERVER_IP
apps.yourdomain.com    →  YOUR_SERVER_IP
```

### Configure in RAILOVER

1. Go to Settings → Root Domain
2. Enter: `apps.yourdomain.com`
3. Enable HTTPS

---

## Firewall Rules

If using UFW:

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp  # CapRover API
ufw allow 996/tcp   # CapRover Registry
ufw allow 7946/tcp  # Docker Swarm
ufw allow 7946/udp
ufw allow 4789/udp  # Docker Overlay
ufw allow 2377/tcp  # Swarm management
ufw enable
```

---

## Troubleshooting

### Check logs

```bash
docker service logs captain-captain --follow
```

### Restart CapRover

```bash
docker service update captain-captain --force
```

### Reset everything

```bash
docker service rm captain-captain
docker service rm captain-nginx
rm -rf /captain
# Then re-run the docker run command
```

---

## Environment Variables

| Variable                 | Description     | Default       |
| ------------------------ | --------------- | ------------- |
| `ACCEPTED_TERMS`         | Accept ToS      | `true`        |
| `MAIN_NODE_IP_ADDRESS`   | Server IP       | auto-detected |
| `BY_PASS_PROXY_CHECK`    | Skip port check | `false`       |
| `CAPTAIN_BASE_DIRECTORY` | Data directory  | `/captain`    |
