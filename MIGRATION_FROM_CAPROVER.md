# Migrating from CapRover to Railover

This guide helps you migrate an existing CapRover installation to Railover without losing any data.

## Prerequisites

- Existing CapRover installation with data you want to preserve
- Access to Docker on your server
- CapRover data in `/captain-data` directory

## Migration Strategy

Railover is fully backward-compatible with CapRover data. The migration is safe because:

1. **Same data structure** - Railover uses the same DataStore format as CapRover
2. **Same volume name** - Both use `/captain-data` for persistence
3. **Password compatibility** - Admin password remains unchanged
4. **No database migration needed** - Config files are JSON-based

## Step-by-Step Migration

### 1. Stop CapRover Container

First, stop your CapRover container to prevent any data corruption:

```bash
# If using Docker directly
docker stop captain-captain

# If using Docker Compose
docker-compose down

# If using Docker Swarm (most common)
docker service scale captain-captain=0
```

### 2. Backup Your Data (Optional but Recommended)

Create a backup of your `/captain-data` directory:

```bash
# Create timestamped backup
sudo cp -r /captain-data /captain-data-backup-$(date +%Y%m%d-%H%M%S)

# Or create a tar archive
cd /captain-data
sudo tar -czf ../captain-data-backup-$(date +%Y%m%d-%H%M%S).tar.gz .
```

### 3. Update to Railover Docker Image

Update your CapRover service to use the Railover image:

```bash
# If using Docker Swarm
docker service update \
  --image ilyosdev/railover:dev \
  captain-captain

# If using Docker directly
docker run -d \
  --name captain-captain \
  --restart always \
  -p 80:80 \
  -p 443:443 \
  -p 3000:3000 \
  -v /captain-data:/captain-data \
  --cap-add SYS_ADMIN \
  ilyosdev/railover:dev

# If using Docker Compose, update image in docker-compose.yml:
# image: ilyosdev/railover:dev
```

### 4. Start Railover

Start the Railover container:

```bash
# Docker Swarm
docker service scale captain-captain=1

# Docker
docker start captain-captain

# Docker Compose
docker-compose up -d
```

### 5. Verify Migration

1. Access the dashboard at `http://your-server-ip`
2. Login with your existing **admin password** (username: `admin`)
3. Verify all your apps, projects, and configurations are present
4. Test one app deployment to ensure everything works

## What Happens During Migration

### Automatic Admin User Creation

On first login with Railover, an `admin` user with SUPER_ADMIN role is automatically created if it doesn't exist. This user will have:

- Username: `admin`
- Email: `admin@localhost`  
- Role: `super_admin`
- Password: Same as your CapRover admin password

### Existing Data Preserved

All of the following is preserved automatically:

- ✅ App definitions and configurations
- ✅ Deployed versions and images
- ✅ Environment variables
- ✅ SSL certificates
- ✅ Custom domains
- ✅ Volumes and persistent data
- ✅ One-click apps
- ✅ Docker registries
- ✅ Nginx configurations

### New Features Available

After migration, you can start using new Railover features:

1. **Multi-user support** - Create team members with role-based access
2. **Project collaborators** - Add users to specific projects
3. **Container stats** - View real-time CPU, memory, and network usage
4. **Realtime logs** - WebSocket-based log streaming with auto-scroll
5. **Project organization** - Organize apps into projects

## Rollback Plan

If anything goes wrong, you can roll back to CapRover:

```bash
# Stop Railover
docker service scale captain-captain=0

# Switch back to CapRover image
docker service update --image caprover/caprover captain-captain

# Start CapRover
docker service scale captain-captain=1
```

## Troubleshooting

### Admin Login Fails

If admin login fails after migration:

1. Check container logs:
   ```bash
   docker service logs captain-captain --tail 100
   ```

2. Verify `/captain-data/config-captain.json` exists
3. If admin user was created incorrectly, you can recreate via database:
   - Stop container
   - Edit `/captain-data/config-captain.json`
   - Manually add admin user object
   - Restart container

### Apps Won't Start

If apps don't start after migration:

1. Check Docker network connectivity
2. Verify volume mounts are correct
3. Check app logs in dashboard
4. Verify environment variables are intact

### Password Hash Mismatch

If you created users before the password hashing fix:

1. Users created before the fix have **incorrect password hashes**
2. Delete and recreate affected users via Team Management
3. New user creations will use correct hashing

## Post-Migration Cleanup

Once you've verified everything works:

1. Remove backup data after a few days:
   ```bash
   sudo rm -rf /captain-data-backup-*
   ```

2. Consider setting up a backup schedule:
   - Use Railover's built-in backup feature
   - Or set up automated backups via cron

## Summary

- Migration time: ~2-5 minutes (mostly for Docker image pull)
- Downtime: Minimal (container restart)
- Data loss risk: Zero (same volume used)
- Rollback time: ~2 minutes

The migration is safe, reversible, and preserves all your existing CapRover data.
