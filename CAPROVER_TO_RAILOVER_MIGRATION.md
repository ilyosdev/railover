# CapRover to Railover Migration Guide

Complete guide for migrating from CapRover to Railover - either on your current VDS or a new server.

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
# Create a backup of your config
sudo cp -r /captain-data /captain-data-backup-$(date +%Y%m%d)

# Verify backup
ls -la /captain-data-backup-*
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

### What Happens Behind the Scenes

- Same `/captain-data` volume is used
- Same Docker network, same ports
- All app definitions preserved
- All SSL certificates preserved
- All environment variables preserved
- Admin user auto-created on first login

---

## Option B: Migrate to New Server

**Time required:** 15-30 minutes  
**Downtime:** Depends on DNS propagation  
**Risk:** Low (old server untouched)

Use this when you want to move to a new VDS without touching the old one.

### Prerequisites on New Server

- Ubuntu 20.04+ or Debian 11+
- Docker installed
- Ports 80, 443, 3000 open
- Domain DNS access

### Step 1: Backup from Old Server (Non-Destructive)

SSH into your **OLD** server:

```bash
# Create backup directory
mkdir -p ~/caprover-backup

# Backup captain-data (configs, certs, app definitions)
sudo tar -czf ~/caprover-backup/captain-data.tar.gz /captain-data

# List all Docker volumes (for databases/persistent apps)
docker volume ls

# Backup each important volume (databases, uploads, etc.)
# Replace VOLUME_NAME with actual volume names like:
# - srv-captain--myapp-mysql
# - srv-captain--myapp-postgres
# - srv-captain--myapp-data

for vol in $(docker volume ls -q | grep srv-captain); do
    echo "Backing up volume: $vol"
    docker run --rm \
        -v $vol:/source:ro \
        -v ~/caprover-backup:/backup \
        alpine tar -czf /backup/$vol.tar.gz -C /source .
done

# Check backup sizes
ls -lh ~/caprover-backup/
```

### Step 2: Transfer to New Server

From your **local machine** or **old server**:

```bash
# Transfer all backups to new server
scp -r ~/caprover-backup/* root@NEW_SERVER_IP:/root/caprover-backup/

# Or if running from local machine:
ssh old-server "cat ~/caprover-backup/captain-data.tar.gz" | \
    ssh new-server "cat > /root/caprover-backup/captain-data.tar.gz"
```

### Step 3: Setup New Server

SSH into your **NEW** server:

```bash
# Install Docker if not installed
curl -fsSL https://get.docker.com | sh

# Initialize Docker Swarm
docker swarm init --advertise-addr $(hostname -I | awk '{print $1}')

# Create backup directory and extract
mkdir -p /root/caprover-backup
cd /root/caprover-backup

# Extract captain-data
sudo tar -xzf captain-data.tar.gz -C /

# Restore Docker volumes
for backup in srv-captain--*.tar.gz; do
    if [ -f "$backup" ]; then
        vol_name="${backup%.tar.gz}"
        echo "Restoring volume: $vol_name"
        docker volume create $vol_name
        docker run --rm \
            -v $vol_name:/dest \
            -v $(pwd):/backup:ro \
            alpine tar -xzf /backup/$backup -C /dest
    fi
done
```

### Step 4: Start Railover

```bash
# Pull required images
docker pull ilyosdev/railover:dev
docker pull caprover/certbot-sleeping:v2.11.0
docker pull nginx:1.27.2

# Start Railover
docker run -d \
    --name captain-captain \
    --restart always \
    --network host \
    -p 80:80 \
    -p 443:443 \
    -p 3000:3000 \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v /captain-data:/captain-data \
    -e ACCEPTED_TERMS=true \
    -e BY_PASS_PROXY_CHECK=true \
    ilyosdev/railover:dev

# Wait for initialization
sleep 30

# Check if running
docker ps | grep captain
```

### Step 5: Update DNS

Update your domain's DNS A record to point to the **new server IP**.

| Record Type | Name | Value |
|-------------|------|-------|
| A | *.your-captain-root.example.com | NEW_SERVER_IP |
| A | your-captain-root.example.com | NEW_SERVER_IP |

Wait for DNS propagation (5-30 minutes).

### Step 6: Redeploy Apps

Apps configs are restored, but containers need to be recreated:

1. Login to Railover dashboard
2. Go to each app → Deployment tab
3. Click "Deploy" to rebuild from source, or
4. If using pre-built images, the app should auto-start

### Step 7: Verify Everything

- [ ] Dashboard accessible
- [ ] All apps listed
- [ ] Apps are running (green status)
- [ ] Custom domains working
- [ ] SSL certificates valid
- [ ] Databases have data

---

## Rollback Procedure

### On Same Server (Option A)

```bash
# Instant rollback to CapRover
docker service update --image caprover/caprover:latest captain-captain

# Wait 30 seconds, then verify
docker service ps captain-captain
```

### On New Server (Option B)

Simply point your DNS back to the old server IP. The old server was never modified.

---

## Post-Migration Setup

### 1. Create Team Members (New Railover Feature)

```
Dashboard → Team → Add Team Member
```

Roles available:
- **Super Admin** - Full access
- **Admin** - Manage apps and projects
- **Developer** - Deploy and view logs
- **Viewer** - Read-only access

### 2. Organize Apps into Projects (New Feature)

```
Dashboard → Projects → Create Project
```

Then assign apps to projects for better organization.

### 3. View Container Stats (New Feature)

Click on any app → Overview tab → Resource Usage section

Shows real-time:
- CPU usage
- Memory usage
- Network I/O

---

## Troubleshooting

### Login Fails After Migration

**Problem:** Can't login with existing password

**Solution:**
```bash
# Check if admin user exists
docker exec -it $(docker ps -q -f name=captain-captain) \
    cat /captain-data/config-captain.json | grep -A5 '"users"'

# If empty, login once with just password (admin auto-created)
```

### Apps Not Starting

**Problem:** Apps show as "not running"

**Solution:**
```bash
# Force redeploy all services
docker service ls | grep srv-captain | awk '{print $2}' | \
    xargs -I {} docker service update --force {}
```

### SSL Certificate Errors

**Problem:** SSL warnings after migration to new server

**Solution:**
```bash
# Re-enable SSL for the root domain
# Dashboard → Settings → Enable HTTPS

# For individual apps:
# App → HTTP Settings → Enable HTTPS
```

### Database Connection Refused

**Problem:** App can't connect to database after migration

**Solution:**
1. Verify database volume was restored
2. Check database container is running
3. Verify environment variables in app settings

```bash
# Check database container
docker ps | grep mysql  # or postgres, mongo, etc.

# Check volume exists
docker volume ls | grep YOUR_DB_NAME
```

### Port Already in Use

**Problem:** "port is already allocated" error

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000

# Stop conflicting service
sudo systemctl stop nginx  # if nginx is running outside Docker
sudo systemctl stop apache2  # if apache is running
```

---

## Comparison: CapRover vs Railover

| Feature | CapRover | Railover |
|---------|----------|----------|
| Single Admin | ✅ | ✅ |
| Multi-User | ❌ | ✅ |
| Team Roles | ❌ | ✅ |
| Project Organization | ❌ | ✅ |
| Container Stats | ❌ | ✅ |
| Realtime Logs | Basic | Enhanced |
| Collaborators | ❌ | ✅ |
| Data Compatible | - | ✅ 100% |

---

## Quick Reference

### Upgrade Commands

```bash
# Upgrade to Railover
docker service update --image ilyosdev/railover:dev captain-captain

# Rollback to CapRover
docker service update --image caprover/caprover:latest captain-captain

# Force restart
docker service update --force captain-captain

# View logs
docker service logs captain-captain --tail 100 -f
```

### Important Paths

| Path | Contents |
|------|----------|
| `/captain-data/` | All configs and data |
| `/captain-data/config-captain.json` | Main configuration |
| `/captain-data/letsencrypt/` | SSL certificates |
| `/captain-data/nginx/` | Nginx configs |

### Docker Service Names

| Service | Purpose |
|---------|---------|
| `captain-captain` | Main Railover backend + frontend |
| `captain-nginx` | Reverse proxy |
| `captain-certbot` | SSL certificate manager |
| `srv-captain--*` | Your deployed apps |

---

## Support

- GitHub Issues: https://github.com/ilyosdev/railover/issues
- Documentation: https://github.com/ilyosdev/railover/blob/master/README.md

