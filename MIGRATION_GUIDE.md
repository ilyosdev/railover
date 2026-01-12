# Migration Guide: CapRover to Railway-like UX

> Guide for existing CapRover users migrating to the Railway-like project-centric experience

## Table of Contents

- [Overview](#overview)
- [What's Changing](#whats-changing)
- [Migration Timeline](#migration-timeline)
- [Backward Compatibility](#backward-compatibility)
- [Step-by-Step Migration](#step-by-step-migration)
- [Data Migration](#data-migration)
- [Feature Mapping](#feature-mapping)
- [FAQ](#faq)
- [Rollback Plan](#rollback-plan)

---

## Overview

The Railway-like UX migration transforms CapRover from an app-centric platform to a **project-centric platform** with enhanced developer experience inspired by Railway.app.

### Key Benefits

✅ **Unified Project View** - See all services (frontend, backend, databases) in one dashboard  
✅ **Service Types** - Visual classification with color coding  
✅ **Hierarchical Environment Variables** - Project-level + service-level inheritance  
✅ **GitHub Integration** - Auto-deploy on push (planned)  
✅ **Database Quick-Create** - One-click PostgreSQL, MySQL, Redis, MongoDB  
✅ **Service Connections** - Visual linking and auto-configuration

### What Stays the Same

✅ **Existing apps continue to work** - No breaking changes  
✅ **API backward compatible** - Old endpoints still supported  
✅ **Same infrastructure** - Docker, NGINX, Let's Encrypt  
✅ **CLI remains functional** - All CLI commands work  
✅ **No data loss** - All apps, configs, and volumes preserved

---

## What's Changing

### Before (Current CapRover)

```
Apps View (flat list):
├── my-frontend
├── my-backend
├── my-postgres
├── my-redis
├── another-app
└── test-app
```

**Characteristics:**

- Apps are independent entities
- No grouping or organization
- No visual service type distinction
- Environment variables per app only
- Manual linking between services

---

### After (Railway-like UX)

```
Projects View:
├── My MERN App
│   ├── 🌐 Frontend (React)
│   ├── ⚙️ Backend (Express)
│   ├── 🗄️ PostgreSQL
│   └── 🗄️ Redis
├── Marketing Site
│   ├── 🌐 Next.js Frontend
│   └── 🗄️ MySQL
└── Background Jobs
    ├── ⚡ Worker Service
    └── ⏰ Cron Job
```

**Characteristics:**

- Apps grouped into projects
- Visual service type classification
- Color-coded cards
- Project-level environment variables
- Visual service connections

---

## Migration Timeline

### Phase 1: Backend Foundation (Completed)

✅ Enhanced data models (`ProjectDefinition`, `ServiceType`)  
✅ Service type classification system  
✅ App definition extended with `serviceType`, `displayName`, etc.

### Phase 2: API Enhancement (In Progress)

🔄 Project overview endpoints  
🔄 Environment variable hierarchy  
🔄 Service connection management  
🔄 Database quick-create templates

### Phase 3: Frontend Rebuild (Upcoming)

⏳ Project dashboard UI  
⏳ Service cards with type indicators  
⏳ Environment variable manager  
⏳ Deployment history view

### Phase 4: GitHub Integration (Planned)

⏳ GitHub App setup  
⏳ Auto-deployment on push  
⏳ Monorepo support  
⏳ Deployment status updates

---

## Backward Compatibility

### Existing Apps

**All existing apps are automatically migrated:**

1. **No action required** - Apps continue running without interruption
2. **Auto-detection of service types** - System infers service type from app name
3. **Default project created** - Apps without projects are grouped in "Default Project"
4. **URLs unchanged** - `appname.captain.domain.com` still works
5. **API compatible** - Old API endpoints continue to function

### Service Type Auto-Detection

The migration script automatically assigns service types based on app names:

| App Name Contains                               | Assigned Type |
| ----------------------------------------------- | ------------- |
| `postgres`, `mysql`, `mongo`, `redis`, `db`     | `database`    |
| `frontend`, `web`, `ui`, `next`, `react`, `vue` | `frontend`    |
| `worker`, `queue`, `job`, `celery`              | `worker`      |
| `cron`, `scheduler`                             | `cron`        |
| Everything else                                 | `backend`     |

**Examples:**

- `my-postgres` → Database
- `frontend-app` → Frontend
- `api-server` → Backend
- `background-worker` → Worker

---

## Step-by-Step Migration

### For New Users

**Start fresh with the new experience:**

1. **Create a project** (new UI)

    ```bash
    curl -X POST http://captain.domain.com/api/v2/user/project/register/ \
      -d '{"name": "my-project", "description": "My first project"}'
    ```

2. **Add services to project**

    - Choose service type (Frontend/Backend/Database/Worker)
    - System automatically configures connections
    - Environment variables inherit from project

3. **Deploy as usual**
    - Git, tarball, or Dockerfile
    - No changes to deployment process

---

### For Existing Users

**Migrate your apps to the new project structure:**

#### Option A: Automatic Migration (Recommended)

**The system automatically migrates your apps on first login after update:**

1. **All existing apps are preserved**
2. **Service types auto-detected** from app names
3. **Default project created** if apps have no project
4. **Review and adjust** service types in UI

**Post-migration checklist:**

- [ ] Login to updated CapRover
- [ ] Navigate to "Projects" view
- [ ] Review auto-assigned service types
- [ ] Adjust types if incorrect
- [ ] Organize apps into meaningful projects

---

#### Option B: Manual Migration

**Manually organize your apps into projects:**

**Step 1: Create Projects**

```bash
# Create project for each logical grouping
curl -X POST http://captain.domain.com/api/v2/user/project/register/ \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "name": "ecommerce-app",
    "description": "E-commerce platform services"
  }'
```

**Step 2: Assign Apps to Projects**

```bash
# Update each app with project ID and service type
curl -X POST http://captain.domain.com/api/v2/user/apps/appdefinition/update/ \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "appName": "shop-frontend",
    "projectId": "ecommerce-app",
    "serviceType": "frontend",
    "displayName": "Shop Frontend"
  }'

curl -X POST http://captain.domain.com/api/v2/user/apps/appdefinition/update/ \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "appName": "shop-api",
    "projectId": "ecommerce-app",
    "serviceType": "backend",
    "displayName": "Shop API",
    "connectedServices": ["shop-postgres"]
  }'

curl -X POST http://captain.domain.com/api/v2/user/apps/appdefinition/update/ \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "appName": "shop-postgres",
    "projectId": "ecommerce-app",
    "serviceType": "database",
    "displayName": "PostgreSQL"
  }'
```

**Step 3: Set Up Project-Level Environment Variables**

```bash
curl -X POST http://captain.domain.com/api/v2/user/project/update/ \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "projectDefinition": {
      "id": "ecommerce-app",
      "name": "ecommerce-app",
      "sharedEnvVars": [
        {"key": "NODE_ENV", "value": "production"},
        {"key": "LOG_LEVEL", "value": "info"}
      ]
    }
  }'
```

---

#### Option C: CLI-Assisted Migration

**Use the migration script:**

```bash
# Download migration script
curl -o migrate.sh https://raw.githubusercontent.com/caprover/caprover/master/scripts/migrate-to-railway-ux.sh
chmod +x migrate.sh

# Run migration
./migrate.sh --url http://captain.domain.com --token YOUR_AUTH_TOKEN

# The script will:
# 1. Fetch all your apps
# 2. Auto-detect service types
# 3. Group apps by existing projectId or create "Default Project"
# 4. Update all apps with service types
# 5. Generate migration report
```

**Migration Report Example:**

```
Migration Summary:
==================
Total Apps: 12
Service Types Assigned:
  - Frontend: 3
  - Backend: 5
  - Database: 3
  - Worker: 1

Projects Created:
  - ecommerce-app (5 services)
  - analytics-platform (4 services)
  - default-project (3 services)

Next Steps:
  1. Review service types at http://captain.domain.com/projects
  2. Adjust any incorrectly assigned types
  3. Set up project-level environment variables
  4. Connect related services
```

---

## Data Migration

### Database Schema Changes

**No breaking changes to data storage:**

✅ **Projects DataStore** - Extended with new fields (backward compatible)  
✅ **Apps DataStore** - Added optional fields (`serviceType`, `displayName`)  
✅ **Existing data preserved** - All apps, volumes, configs remain intact

### Migration Script Details

**File**: `scripts/migrate-to-railway-ux.ts`

```typescript
async function migrateAppsToProjects() {
    const apps = await dataStore.getAppDefinitions()

    // Group by existing projectId
    const projectGroups = groupAppsByProject(apps)

    for (const [projectId, apps] of projectGroups) {
        // Auto-detect service types
        apps.forEach((app) => {
            app.serviceType = detectServiceType(app)
            app.displayName = generateDisplayName(app)
        })

        // Update project with services
        await updateProjectServices(projectId, apps)
    }

    console.log('Migration complete!')
}

function detectServiceType(app: IAppDef): ServiceType {
    const name = app.appName?.toLowerCase() || ''

    if (/postgres|mysql|mongo|redis|mariadb|db/.test(name)) {
        return ServiceType.DATABASE
    }
    if (/frontend|web|ui|next|react|vue|angular/.test(name)) {
        return ServiceType.FRONTEND
    }
    if (/worker|queue|job|celery|sidekiq/.test(name)) {
        return ServiceType.WORKER
    }
    if (/cron|scheduler|timer/.test(name)) {
        return ServiceType.CRON
    }

    return ServiceType.BACKEND // Default
}

function generateDisplayName(app: IAppDef): string {
    // Convert "my-app-name" to "My App Name"
    return app.appName
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}
```

---

## Feature Mapping

### Old vs New Features

| Old Feature                       | New Feature                               | Notes                                |
| --------------------------------- | ----------------------------------------- | ------------------------------------ |
| Apps list                         | Projects dashboard                        | Apps now grouped by project          |
| App details                       | Service details                           | Same functionality, new UI           |
| Environment variables (app-level) | Environment variables (project + service) | Hierarchical inheritance             |
| One-click apps                    | Database quick-create                     | Enhanced with service type awareness |
| Git deployment                    | Git deployment + GitHub App               | Auto-deploy coming soon              |
| Custom domains                    | Custom domains                            | Unchanged                            |
| SSL management                    | SSL management                            | Unchanged                            |
| App logs                          | Service logs                              | Same logs, new UI                    |

### New Features

✨ **Project-level environment variables** - Share vars across all services  
✨ **Service type classification** - Visual indicators and grouping  
✨ **Service connections** - Visual dependency graph (planned)  
✨ **Database templates** - PostgreSQL, MySQL, Redis, MongoDB one-click  
✨ **Deployment history** - Unified view across all services (planned)

---

## FAQ

### Q: Will my apps stop working during migration?

**A:** No. Migration is non-destructive and happens in the background. All apps continue running without interruption.

---

### Q: Do I need to redeploy my apps?

**A:** No. Apps continue running with their current deployments. Redeployment is optional and only needed if you want to update configurations.

---

### Q: What if I don't want to use projects?

**A:** You can continue using the old apps list view. Both views will be available during the transition period. Projects are opt-in.

---

### Q: How do I revert to the old interface?

**A:** Use the "Classic View" toggle in the top-right corner (planned feature). You can also use the API directly, which remains unchanged.

---

### Q: What happens to apps without a project?

**A:** They are automatically assigned to a "Default Project". You can move them to other projects later.

---

### Q: Can I have multiple projects?

**A:** Yes! You can create as many projects as needed to organize your services.

---

### Q: Do environment variables from the app override project variables?

**A:** Yes. Service-level environment variables override project-level variables with the same key name.

**Example:**

```
Project vars:
  API_KEY = "project-key"

Service vars:
  API_KEY = "service-key"  ← This wins
  PORT = "3000"

Final result:
  API_KEY = "service-key"
  PORT = "3000"
```

---

### Q: What if auto-detection assigns the wrong service type?

**A:** You can manually change the service type in the UI or via API:

```bash
curl -X POST http://captain.domain.com/api/v2/user/apps/appdefinition/update/ \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "appName": "my-app",
    "serviceType": "frontend"
  }'
```

---

### Q: Can I have nested projects?

**A:** Yes, projects support the `parentProjectId` field for hierarchical organization.

```json
{
    "name": "backend-services",
    "parentProjectId": "main-project"
}
```

---

### Q: Will CLI commands change?

**A:** No. All existing CLI commands continue to work. New commands may be added for project management.

---

### Q: How do service connections work?

**A:** You can specify which services connect to each other. The system will:

1. Auto-inject connection environment variables
2. Display visual dependency graph
3. Ensure proper startup order (planned)

**Example:**

```bash
# Connect backend to database
curl -X POST http://captain.domain.com/api/v2/user/apps/appdefinition/update/ \
  -d '{
    "appName": "backend",
    "connectedServices": ["postgres", "redis"]
  }'

# System auto-adds these to backend:
# DATABASE_URL=postgresql://postgres:5432/db
# REDIS_URL=redis://redis:6379
```

---

### Q: Can I export/import project configurations?

**A:** Yes! Use the existing backup system:

```bash
# Create backup (includes all projects and apps)
curl -X POST http://captain.domain.com/api/v2/user/system/createbackup/ \
  -H "x-captain-auth: $TOKEN"

# Backup file includes all project definitions
```

---

### Q: What about multi-node clusters?

**A:** Projects work seamlessly with multi-node clusters. Service placement (`nodeId`) is still respected.

---

## Rollback Plan

### If You Need to Rollback

**The migration is designed to be reversible:**

### Option 1: Database Restore

```bash
# Restore from backup taken before migration
docker exec captain-captain \
  captain restore --backupFile /captain/data/backup.tar
```

### Option 2: Manual Rollback

```bash
# Remove service types from all apps
curl -X POST http://captain.domain.com/api/v2/user/apps/appdefinition/update/ \
  -d '{
    "appName": "my-app",
    "serviceType": null,
    "displayName": null,
    "connectedServices": []
  }'

# Or use the rollback script
./scripts/rollback-railway-ux.sh --url http://captain.domain.com --token $TOKEN
```

### Option 3: Docker Image Rollback

```bash
# Stop CapRover
docker service update --image caprover/caprover:1.10.0 captain-captain

# Replace with previous version
```

---

## Best Practices

### Organizing Projects

**✅ Good Project Structure:**

```
ecommerce-platform/
├── web (frontend)
├── api (backend)
├── admin-panel (frontend)
├── postgres (database)
└── redis (database)

payment-service/
├── payment-api (backend)
├── payment-worker (worker)
└── postgres (database)
```

**❌ Bad Project Structure:**

```
default-project/
├── random-app-1
├── test-app
├── old-app
└── new-app-2
```

---

### Environment Variable Strategy

**Project-level (shared across all services):**

- `NODE_ENV`
- `LOG_LEVEL`
- `REGION`
- `FEATURE_FLAGS`

**Service-level (specific to service):**

- `PORT`
- `DATABASE_URL` (for apps that need DB)
- `API_KEYS` (service-specific)
- `REDIS_URL` (for apps that use Redis)

---

### Service Naming

**✅ Good Names:**

- `web` or `frontend`
- `api` or `backend`
- `postgres` or `db`
- `worker` or `queue-worker`

**❌ Bad Names:**

- `my-app-frontend-v2-test` (too long, unclear)
- `App1` (not descriptive)
- `temp` (unclear purpose)

---

## Support & Resources

### Documentation

- **API Endpoints**: `/Users/mac/Documents/my-products/railover/API_ENDPOINTS.md`
- **Frontend Components**: `/Users/mac/Documents/my-products/railoover-frontend/COMPONENTS.md`
- **Testing Guide**: `/Users/mac/Documents/my-products/railover/TESTING.md`
- **Migration Plan**: `/Users/mac/Documents/my-products/railover/RAILWAY_MIGRATION_PLAN.md`

### Community

- **GitHub Issues**: https://github.com/caprover/caprover/issues
- **Discord**: https://discord.gg/caprover
- **Forum**: https://caprover.com/community

### Getting Help

1. Check this migration guide
2. Review the FAQ section
3. Search GitHub issues
4. Ask in Discord/Forum
5. Create a GitHub issue

---

## Migration Checklist

### Pre-Migration

- [ ] Backup your CapRover instance
- [ ] Review current app list
- [ ] Plan project structure
- [ ] Test in development environment first

### During Migration

- [ ] Update CapRover to latest version
- [ ] Run migration script or auto-migrate on login
- [ ] Review auto-assigned service types
- [ ] Adjust incorrect service types
- [ ] Create additional projects if needed

### Post-Migration

- [ ] Verify all apps still running
- [ ] Test deployments
- [ ] Set up project-level environment variables
- [ ] Configure service connections
- [ ] Update team documentation
- [ ] Train team on new UI

---

**Last Updated**: January 6, 2026

**Migration Support**: For issues or questions, please create a GitHub issue with the label `railway-migration`.
