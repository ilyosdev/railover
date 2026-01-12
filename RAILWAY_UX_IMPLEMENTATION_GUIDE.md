# Railway UX Implementation Guide

## Executive Summary

This document outlines how to transform our CapRover-based platform to deliver a Railway-like developer experience. Based on extensive research of Railway's platform, philosophy, and UX patterns.

---

## Part 1: Railway's Core Philosophy

### "Ship Software Peacefully"

Railway's entire platform is built around one principle: **let developers create without being burdened by infrastructure**.

Key pillars:

1. **Magic by Default** - It just works out of the box
2. **Flexibility on Demand** - Take what you need, leave what you don't
3. **Visual Legibility** - Entire stack readable at a glance
4. **Zero Config Networking** - Private connections, public endpoints, SSL automatic

### Three Stages of Developer Experience

Railway designs for all three stages:

1. **Development** - Git-native tooling, local development
2. **Deployment** - Push → Build → Deploy → URL ready
3. **Diagnosis** - Logs, metrics, alerts in one place

---

## Part 2: Visual Canvas - The Heart of Railway

### Project Canvas Concept

Railway's most distinctive feature is the **visual canvas** where services appear as draggable nodes:

```
+------------------+     +------------------+
|   Backend API    |---->|    PostgreSQL    |
|   (Node.js)      |     |    (Database)    |
|   [Running]      |     |   [Running]      |
+------------------+     +------------------+
        |
        v
+------------------+
|    Frontend      |
|    (React)       |
|   [Building]     |
+------------------+
```

**Key Features:**

- Services are visual cards/nodes on a 2D canvas
- Drag-and-drop to rearrange
- Visual connection lines between services
- Color-coded status indicators (green=running, yellow=building, red=failed)
- Click to open service details in a side panel/drawer

### Implementation Priority: HIGH

**What we need:**

1. Canvas component using React Flow or similar
2. Service nodes with status, name, type icons
3. Connection lines showing dependencies
4. Zoom/pan controls
5. Service groups (optional grouping)

---

## Part 3: Service Creation Flow

### Railway's Approach

When you click "New Service" in Railway:

```
Step 1: Choose Source
┌─────────────────────────────────────────────────────────┐
│  ○ Deploy from GitHub repo                              │
│  ○ Deploy from Docker Image                             │
│  ○ Add Database (PostgreSQL, MySQL, Redis, MongoDB)     │
│  ○ Empty Service                                        │
└─────────────────────────────────────────────────────────┘

Step 2: (If GitHub) Select Repository
- Shows list of connected repos
- One-click to select
- Optionally select branch

Step 3: Auto-configure
- Railway detects language/framework
- Sets up build command automatically
- Configures environment
- Deploys immediately
```

**Key UX Principle:** Minimal steps, maximum automation

### Current State vs Target

| Current                            | Target                     |
| ---------------------------------- | -------------------------- |
| Multi-step wizard with many fields | 2-3 click deployment       |
| Manual GitHub credentials          | OAuth connection to GitHub |
| Manual port configuration          | Auto-detected              |
| No auto-detection                  | Nixpacks-style detection   |

### Implementation Changes Needed

1. **GitHub OAuth Integration**

    - Connect GitHub account once
    - List user's repos automatically
    - No manual repo URL entry

2. **Auto-Detection Service**

    - Detect language from repo (package.json, requirements.txt, go.mod, etc.)
    - Set reasonable defaults for port, build command, start command

3. **Simplified UI**
    - Remove GitHub username/password fields (use OAuth)
    - Remove branch field if main/master
    - Auto-suggest service name from repo name

---

## Part 4: Environment Variables - Reference Variables

### Railway's Variable System

Railway has a sophisticated variable system:

```
Service Variables    → Scoped to one service
Shared Variables     → Project-wide, all services can access
Reference Variables  → ${{ServiceName.VAR_NAME}} syntax
```

**Example:**

```
# In PostgreSQL service
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# In Backend service (references PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Key UX Features

1. **Visual Variable Editor**

    - Table view with Key | Value | Actions
    - Inline editing
    - Copy button for each value
    - Show/hide sensitive values
    - Reference autocomplete

2. **Reference Variable Syntax**

    ```
    ${{shared.DOMAIN}}           # Shared variable
    ${{Postgres.DATABASE_URL}}   # From another service
    ${{RAILWAY_PUBLIC_DOMAIN}}   # Platform variable
    ```

3. **Variable Inheritance Visual**
    - Show where variable came from (inherited vs local)
    - Override indicator

### Implementation Changes

1. **Add Reference Variable Support**

    - Parser for `${{service.var}}` syntax
    - Autocomplete for available services/vars
    - Resolution at runtime

2. **Shared Variables UI**
    - Project-level variables tab
    - "Promote to shared" action
    - Clear inheritance indicators

---

## Part 5: Deployment Experience

### Railway's Deploy Flow

```
Push to GitHub
    ↓
Webhook triggers
    ↓
Build starts (real-time logs)
    ↓
Image pushed
    ↓
New deployment created
    ↓
Health check
    ↓
Traffic shifted (zero-downtime)
    ↓
Old deployment removed
```

### Deployment Panel UX

```
┌────────────────────────────────────────────────────────┐
│ DEPLOYMENT HISTORY                          [Deploy]   │
├────────────────────────────────────────────────────────┤
│ ● #5 CURRENT     abc1234 "Fix auth bug"    2m ago     │
│   Build: 45s | Deploy: 12s | Running                   │
│                                                        │
│ ○ #4             def5678 "Add logging"     1h ago     │
│   Build: 52s | Deploy: 15s | Superseded                │
│                                                        │
│ ○ #3             ghi9012 "Initial"         2h ago     │
│   Build: 1m 20s | Deploy: 18s | Superseded             │
└────────────────────────────────────────────────────────┘
```

**Key Features:**

- Current deployment highlighted
- One-click rollback to any previous
- Git commit info (hash, message, author)
- Build duration, deploy duration
- Status badges

### Implementation Changes

1. **Deployment List View**

    - Show all deployments with status
    - Highlight current
    - Show git info

2. **One-Click Rollback**

    - Rollback button on each deployment
    - Confirmation dialog
    - Instant rollback

3. **Real-time Build Logs**
    - Streaming logs during build
    - Color-coded (info, warn, error)
    - Auto-scroll with pause option

---

## Part 6: Logs & Monitoring

### Railway's Log Explorer

```
┌─────────────────────────────────────────────────────────┐
│ LOGS                                    [Filter] [⟳]   │
├─────────────────────────────────────────────────────────┤
│ Service: [All ▼]  Level: [All ▼]  Time: [Last 1h ▼]   │
├─────────────────────────────────────────────────────────┤
│ 14:32:05 INFO  backend   Server started on port 3000   │
│ 14:32:06 INFO  postgres  Connection established        │
│ 14:32:10 WARN  backend   Slow query detected (2.3s)    │
│ 14:32:15 ERROR backend   Failed to connect to Redis    │
│ 14:32:16 INFO  redis     Ready to accept connections   │
│ 14:32:17 INFO  backend   Redis reconnected             │
└─────────────────────────────────────────────────────────┘
```

**Key Features:**

- Unified log view across all services
- Real-time streaming
- Filtering by service, level, time range
- Search/query syntax
- Structured log support (JSON parsing)
- "View in context" - see surrounding logs

### Metrics Dashboard

```
┌─────────────────────────────────────────────────────────┐
│ METRICS                              [1h] [24h] [7d]   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  CPU Usage          Memory Usage        Network I/O     │
│  ┌──────────┐       ┌──────────┐       ┌──────────┐    │
│  │    ╱╲    │       │   ───    │       │  ╱╲ ╱╲   │    │
│  │   ╱  ╲   │       │  ╱   ╲   │       │ ╱  ╲  ╲  │    │
│  │──╱    ╲──│       │─╱     ╲──│       │╱        ╲│    │
│  └──────────┘       └──────────┘       └──────────┘    │
│   23% avg           412 MB              1.2 GB/h       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Implementation Changes

1. **Unified Log Explorer**

    - Aggregate logs from all services
    - Real-time WebSocket streaming
    - Filter controls
    - Search bar with query syntax

2. **Metrics Charts**
    - CPU, Memory, Network, Disk graphs
    - Time range selector
    - Per-service breakdown

---

## Part 7: Service Detail Drawer

### Railway's Service Panel

When clicking a service on the canvas, a drawer slides in:

```
┌─────────────────────────────────────────────────────────┐
│ [×]  backend-api                               [⋮]     │
│ ● Running   Deployed 5 minutes ago                     │
├─────────────────────────────────────────────────────────┤
│ [Overview] [Deployments] [Logs] [Variables] [Settings] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  SERVICE CONFIGURATION                                  │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │ REPLICAS        │  │ REGION          │              │
│  │     1           │  │   us-west       │              │
│  └─────────────────┘  └─────────────────┘              │
│                                                         │
│  NETWORKING                                             │
│  Public URL: https://backend-api.up.railway.app        │
│  Private:    backend-api.railway.internal              │
│                                                         │
│  CONNECTED SERVICES                                     │
│  → PostgreSQL (DATABASE_URL injected)                  │
│  → Redis (REDIS_URL injected)                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Tabs:**

1. **Overview** - Status, URLs, connections, quick actions
2. **Deployments** - History, rollback
3. **Logs** - Service-specific logs
4. **Variables** - Environment config
5. **Settings** - Build, networking, scaling

---

## Part 8: Implementation Priority Matrix

### Phase 1: Foundation (Must Have)

| Feature                       | Effort | Impact |
| ----------------------------- | ------ | ------ |
| Fix service status display    | Low    | High   |
| Improve service creation flow | Medium | High   |
| Real-time deployment logs     | Medium | High   |
| One-click database creation   | Done   | High   |
| Service detail drawer         | Done   | High   |

### Phase 2: Visual Canvas (High Value)

| Feature                   | Effort | Impact    |
| ------------------------- | ------ | --------- |
| Canvas-based project view | High   | Very High |
| Draggable service nodes   | High   | Medium    |
| Visual connection lines   | Medium | Medium    |
| Service status on canvas  | Low    | High      |

### Phase 3: Variables & Connections (Medium Value)

| Feature                          | Effort | Impact |
| -------------------------------- | ------ | ------ |
| Reference variable syntax        | Medium | High   |
| Shared variables UI              | Medium | Medium |
| Variable autocomplete            | Medium | Medium |
| Service connection visualization | Medium | Medium |

### Phase 4: Monitoring & Logs (Quality of Life)

| Feature                 | Effort | Impact |
| ----------------------- | ------ | ------ |
| Unified log explorer    | High   | High   |
| Real-time log streaming | Medium | High   |
| Metrics dashboard       | High   | Medium |
| Alerting                | High   | Medium |

---

## Part 9: Specific Code Changes Needed

### Backend Changes

1. **Service Status API**

    ```typescript
    // New endpoint: GET /user/projects/:projectId/services/:serviceName/status
    {
      isRunning: boolean,
      deployedImageName: string,
      deployedAt: string,
      replicas: number,
      health: 'healthy' | 'unhealthy' | 'starting'
    }
    ```

2. **Reference Variables Resolution**

    ```typescript
    // EnvVarManager.ts - Add resolution
    resolveReferenceVariables(serviceEnvVars, allProjectServices)
    // Parse ${{serviceName.varName}} and replace
    ```

3. **Deployment History**
    ```typescript
    // GET /user/apps/:appName/deployments
    // Return full deployment history with git info, build times, status
    ```

### Frontend Changes

1. **Canvas Component** (New)

    - Use React Flow library
    - Service nodes with status
    - Connection edges
    - Zoom/pan controls

2. **Service Drawer Improvements**

    - Fix version lookup (deployedVersion, not versions[0])
    - Add Deployments tab with history
    - Add rollback button
    - Show connected services

3. **Variables Editor**

    - Add reference variable syntax highlighting
    - Autocomplete for `${{` pattern
    - Show inherited variables differently

4. **Log Viewer**
    - WebSocket streaming
    - Filter by level
    - Search functionality
    - JSON log formatting

---

## Part 10: Quick Wins (Implement Now)

### 1. Fix Service Card Status

Current issue: Shows "Not Configured" even when running.

Fix: Already implemented - use `deployedVersion` to find correct version.

### 2. Simplify Service Creation

Remove:

- GitHub username/password (use OAuth later)
- Make repo optional (allow image-only deployment)

Add:

- "Deploy from Image" option
- Better error messages

### 3. Improve Deployment Tab

Add:

- Deployment history list
- Current deployment highlight
- Rollback button
- Build duration display

### 4. Better Database Experience

Already good, but add:

- Connection string copy button
- Quick connect snippets (Prisma, TypeORM, etc.)
- Data browser link (pgAdmin, etc.)

---

## Summary: Railway vs Current State

| Aspect           | Railway          | Current        | Gap    |
| ---------------- | ---------------- | -------------- | ------ |
| Project View     | Visual Canvas    | List/Cards     | Major  |
| Service Creation | 2-3 clicks       | 5+ fields      | Medium |
| Deployment       | Auto on push     | Manual trigger | Minor  |
| Variables        | Reference syntax | Basic          | Medium |
| Logs             | Unified explorer | Per-service    | Medium |
| Metrics          | Dashboard        | Basic          | Major  |
| Status Display   | Accurate         | Buggy          | Fixed  |

**Bottom Line:** The biggest differentiator is the **visual canvas**. Everything else can be incrementally improved. The canvas is what makes Railway feel modern and intuitive.

---

## Next Steps

1. **Immediate:** Apply fixes already made (service status, deployment)
2. **Short-term:** Simplify service creation, improve deployment tab
3. **Medium-term:** Implement visual canvas
4. **Long-term:** Unified log explorer, metrics dashboard, reference variables
