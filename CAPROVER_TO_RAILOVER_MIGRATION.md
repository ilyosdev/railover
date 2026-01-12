# CapRover to Railover Migration Guide

Complete guide for migrating from CapRover to Railover - either on your current VDS or a new server.

> **Note:** CapRover data location varies by installation:
> - Older installations: `/captain/data/`
> - Newer installations: `/captain-data/`
> 
> Check which one you have: `ls -la /captain /captain-data 2>/dev/null`

## Table of Contents
- [Option A: Upgrade on Same Server (Recommended)](#option-a-upgrade-on-same-server-recommended)
- [Option B: Migrate to New Server](#option-b-migrate-to-new-server)
- [Rollback Procedure](#rollback-procedure)
- [Post-Migration Setup](#post-migration-setup)
- [Troubleshooting](#troubleshooting)

---

## Option A: Upgrade on Same Server (Recommended)

**Time required:** ~2 minutes  
**Downtime:** ~30 seconds  
**Risk:** Very Low (instant rollback available)

This is the safest option. Nothing is deleted - you're just swapping the Docker image.

### Step 1: Backup (Optional but Recommended)

```bash
# Find your data directory
DATA_DIR=$(ls -d /captain-data 2>/dev/null || ls -d /captain/data 2>/dev/null)
echo "Data directory: $DATA_DIR"

# Create a backup
sudo cp -r $DATA_DIR ${DATA_DIR}-backup-$(date +%Y%m%d)

# Verify backup
ls -la ${DATA_DIR}-backup-* 2>/dev/null || ls -la /captain/data-backup-* 2>/dev/null
```

### Step 2: Upgrade to Railover

```bash
# Single command upgrade
docker service update --image ilyosdev/railover:dev captain-captain
```

That's it! Wait ~30 seconds for the service to restart.

### Step 3: Verify

1. Open your CapRover dashboard URL
2. Login with:
   - **Username:** `admin`
   - **Password:** Your existing CapRover password
3. Verify all apps are listed
4. Check one app is accessible

---

## Option B: Migrate to New Server

**Time required:** 15-30 minutes  
**Downtime:** Depends on DNS propagation  
**Risk:** Low (old server untouched)

### Step 1: Backup from Old Server (Non-Destructive)

SSH into your **OLD** server:

```bash
# Create backup directory
mkdir -p ~/caprover-backup

# Find data directory (older vs newer installations)
if [ -d "/captain-data" ]; then
    DATA_DIR="/captain-data"
elif [ -d "/captain/data" ]; then
    DATA_DIR="/captain/data"
else
    echo "ERROR: Cannot find CapRover data directory"
    exit 1
fi

echo "Found data at: $DATA_DIR"

# Backup captain data (configs, certs, app definitions)
sudo tar -czf ~/caprover-backup/captain-data.tar.gz -C $(dirname $DATA_DIR) $(basename $DATA_DIR)

# List all Docker volumes (for databases/persistent apps)
echo "=== Docker Volumes ==="
docker volume ls | grep srv-captain

# Backup each app volume (databases, uploads, etc.)
for vol in $(docker volume ls -q | grep srv-captain); do
    echo "Backing up volume: $vol"
    docker run --rm \
        -v $vol:/source:ro \
        -v ~/caprover-backup:/backup \
        alpine tar -czf /backup/$vol.tar.gz -C /source .
done

# Check backup sizes
echo "=== Backup Files ==="
ls -lh ~/caprover-backup/
```

### Step 2: Transfer to New Server

```bash
# From OLD server, copy to NEW server
scp -r ~/caprover-backup/* root@NEW_SERVER_IP:~/caprover-backup/
```

### Step 3: Setup New Server

SSH into your **NEW** server:

```bash
# Install Docker if not installed
curl -fsSL https://get.docker.com | sh

# Initialize Docker Swarm
docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')

# Create directories
mkdir -p ~/caprover-backup
mkdir -p /captain-data

# Extract captain-data
cd ~/caprover-backup
tar -xzf captain-data.tar.gz

# Move to correct location (Railover uses /captain-data)
# If backup was from /captain/data:
if [ -d "data" ]; then
    mv data/* /captain-data/
elif [ -d "captain-data" ]; then
    mv captain-data/* /captain-data/
fi

# Restore Docker volumes
for backup in srv-captain--*.tar.gz; do
    if [ -f "$backup" ]; then
        vol_name="${backup%.tar.gz}"
        echo "Restoring volume: $vol_name"
        docker volume create $vol_name
        docker run --rm \
            -v $vol_name:/dest \
            -v $(pwd):/backup:ro \
            alpine sh -c "cd /dest && tar -xzf /backup/$backup"
    fi
done
```

### Step 4: Start Railover

```bash
# Create captain network
docker network create --driver overlay captain-overlay-network 2>/dev/null || true

# Start Railover as a service
docker service create \
    --name captain-captain \
    --network captain-overlay-network \
    --publish 80:80 \
    --publish 443:443 \
    --publish 3000:3000 \
    --constraint 'node.role == manager' \
    --mount type=bind,source=/var/run/docker.sock,target=/var/run/docker.sock \
    --mount type=bind,source=/captain-data,target=/captain-data \
    -e ACCEPTED_TERMS=true \
    ilyosdev/railover:dev

# Wait for startup
echo "Waiting for Railover to start..."
sleep 30

# Check status
docker service ps captain-captain
```

### Step 5: Update DNS

Update your domain's DNS A record:

| Type | Name | Old Value | New Value |
|------|------|-----------|-----------|
| A | *.captain.yourdomain.com | OLD_IP | NEW_IP |
| A | captain.yourdomain.com | OLD_IP | NEW_IP |

### Step 6: Redeploy Apps

After DNS propagates:
1. Login to dashboard
2. Go to each app → Deploy tab
3. Click deploy or the apps may auto-start

---

## Rollback Procedure

### Same Server
```bash
# Instant rollback
docker service update --image caprover/caprover:latest captain-captain
```

### New Server
Just point DNS back to old server. Nothing was changed there.

---

## Post-Migration Setup

### New Railover Features

1. **Multi-User Team Management**
   - Dashboard → Team → Add Team Member
   - Roles: Super Admin, Admin, Developer, Viewer

2. **Container Stats**
   - Click any app → Overview → Resource Usage
   - See CPU, Memory, Network in real-time

3. **Project Organization**
   - Dashboard → Projects → Create Project
   - Group related apps together

---

## Troubleshooting

### "Cannot find config file"

```bash
# Check where your data is
ls -la /captain-data/config-captain.json
ls -la /captain/data/config-captain.json

# If in wrong location, move it
mv /captain/data/* /captain-data/
```

### Login Fails

The first login creates an `admin` user automatically.
- Username: `admin`
- Password: Your existing CapRover password

### Apps Not Starting After Migration

```bash
# List services
docker service ls

# Force redeploy all app services
docker service ls | grep srv-captain | awk '{print $2}' | \
    xargs -I {} docker service update --force {}
```

### Volume Mount Errors

```bash
# List volumes
docker volume ls

# Check if volume has data
docker run --rm -v VOLUME_NAME:/data alpine ls -la /data
```

---

## Quick Reference

```bash
# Upgrade to Railover
docker service update --image ilyosdev/railover:dev captain-captain

# Rollback to CapRover  
docker service update --image caprover/caprover:latest captain-captain

# View logs
docker service logs captain-captain -f --tail 100

# Restart
docker service update --force captain-captain
```

## Data Paths

| Installation | Config Path |
|-------------|-------------|
| Older CapRover | `/captain/data/config-captain.json` |
| Newer CapRover | `/captain-data/config-captain.json` |
| Railover | `/captain-data/config-captain.json` |

---

**GitHub:** https://github.com/ilyosdev/railover
