# Phase 3: Enhanced API Routes - Implementation Summary

## Overview

Phase 3 of the Railway-like UX migration has been successfully implemented. This phase adds comprehensive REST API endpoints for managing projects, services, databases, environment variables, connections, and GitHub integration.

## Created Files

### 1. `/src/user/EnvVarManager.ts` ✅

Manages hierarchical environment variables with project-level and service-level scopes.

**Key Methods:**

- `getMergedEnvVars(appName)` - Merges project + service env vars (service overrides)
- `getProjectEnvVars(projectId)` - Gets project-level env vars
- `setProjectEnvVar(projectId, key, value)` - Sets project-level env var
- `deleteProjectEnvVar(projectId, key)` - Deletes project-level env var
- `setServiceEnvVar(appName, key, value)` - Sets service-level env var
- `deleteServiceEnvVar(appName, key)` - Deletes service-level env var

### 2. `/src/user/ServiceConnectionManager.ts` ✅

Manages service-to-service connections with automatic environment variable injection.

**Key Methods:**

- `connectServices(projectId, fromService, toService)` - Connects services and injects connection env vars
- `disconnectServices(projectId, fromService, toService)` - Removes connections
- `getServiceConnections(projectId)` - Lists all service connections

**Features:**

- Auto-detects database type and injects appropriate connection variables (DATABASE_URL, DB_HOST, etc.)
- For regular services, creates SERVICE_URL and SERVICE_HOST variables
- Updates project service references with connection graph

### 3. `/src/routes/user/github/GitHubRouter.ts` ✅

Handles GitHub integration for automated deployments.

**Endpoints:**

- `POST /github/connect` - Connect GitHub repo to project
- `POST /github/disconnect` - Disconnect GitHub from project
- `POST /github/webhook` - GitHub webhook receiver (handles push events)
- `GET /github/repos` - List available repos (placeholder for GitHub App)

### 4. Enhanced `/src/routes/user/ProjectsRouter.ts` ✅

Extended with 11 new endpoints for comprehensive project management.

---

## API Endpoints

### Base URL

```
http://your-caprover-instance.com/api/v2/user
```

All endpoints require authentication via the `x-captain-auth` header with your auth token.

---

## 1. Project Overview

### **GET `/projects/:projectId/overview`**

Returns complete project details including all services and recent deployments.

**Response:**

```json
{
  "status": 100,
  "description": "Project overview retrieved",
  "data": {
    "project": {
      "id": "uuid",
      "name": "my-project",
      "description": "My awesome project",
      "githubIntegration": { ... },
      "sharedEnvVars": [...],
      "services": [...]
    },
    "services": [
      {
        "appName": "my-app",
        "projectId": "uuid",
        "serviceType": "backend",
        "displayName": "My Backend API",
        "envVars": [...],
        "versions": [...]
      }
    ]
  }
}
```

**Example:**

```bash
curl -X GET \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/overview \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN'
```

---

## 2. Environment Variables

### **GET `/projects/:projectId/env`**

Get project-level environment variables.

**Response:**

```json
{
    "status": 100,
    "description": "Project environment variables retrieved",
    "data": {
        "envVars": [
            { "key": "API_KEY", "value": "secret123" },
            { "key": "NODE_ENV", "value": "production" }
        ]
    }
}
```

**Example:**

```bash
curl -X GET \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/env \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN'
```

### **POST `/projects/:projectId/env`**

Add or update a project-level environment variable.

**Request Body:**

```json
{
    "key": "API_KEY",
    "value": "my-secret-key"
}
```

**Example:**

```bash
curl -X POST \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/env \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "key": "API_KEY",
    "value": "my-secret-key"
  }'
```

### **DELETE `/projects/:projectId/env/:key`**

Delete a project-level environment variable.

**Example:**

```bash
curl -X DELETE \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/env/API_KEY \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN'
```

---

## 3. Service Management

### **POST `/projects/:projectId/services`**

Add an existing service/app to the project's service registry.

**Request Body:**

```json
{
    "appName": "my-backend",
    "serviceType": "backend",
    "displayName": "Backend API"
}
```

**Service Types:**

- `frontend` - Web frontends (React, Vue, Next.js)
- `backend` - API servers (Node.js, Python, Go)
- `database` - Databases (auto-detected for db services)
- `worker` - Background workers
- `cron` - Scheduled tasks

**Example:**

```bash
curl -X POST \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/services \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "appName": "my-backend",
    "serviceType": "backend",
    "displayName": "Backend API"
  }'
```

### **PUT `/projects/:projectId/services/:serviceName`**

Update service metadata (displayName, serviceType).

**Request Body:**

```json
{
    "displayName": "New Display Name",
    "serviceType": "backend"
}
```

**Example:**

```bash
curl -X PUT \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/services/my-backend \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "displayName": "Updated Backend API"
  }'
```

### **DELETE `/projects/:projectId/services/:serviceName`**

Remove a service from the project registry (doesn't delete the app itself).

**Example:**

```bash
curl -X DELETE \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/services/my-backend \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN'
```

---

## 4. Database Quick-Create

### **POST `/projects/:projectId/databases`**

Create a new database service with one API call (Railway-style).

**Request Body:**

```json
{
    "type": "postgres",
    "name": "my-database",
    "version": "16"
}
```

**Supported Databases:**

- `postgres` - PostgreSQL (versions: 15, 16)
- `mysql` - MySQL (version: 8)
- `redis` - Redis (version: 7)
- `mongodb` - MongoDB (version: 7)

**Features:**

- Auto-generates secure random password
- Creates persistent volume for data
- Adds database to project services registry
- Tags service as database type

**Example:**

```bash
curl -X POST \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/databases \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "postgres",
    "name": "my-postgres-db",
    "version": "16"
  }'
```

**Response:**

```json
{
  "status": 100,
  "description": "Database created successfully",
  "data": {
    "app": {
      "appName": "my-postgres-db",
      "projectId": "uuid",
      "hasPersistentData": true,
      "envVars": [
        { "key": "POSTGRES_PASSWORD", "value": "auto-generated-secure-password" },
        { "key": "POSTGRES_USER", "value": "postgres" },
        { "key": "POSTGRES_DB", "value": "postgres" }
      ],
      "volumes": [...],
      "tags": [
        { "tagName": "database" },
        { "tagName": "postgres" }
      ]
    }
  }
}
```

---

## 5. Service Connections

### **POST `/projects/:projectId/connections`**

Connect two services (e.g., backend → database) with automatic environment variable injection.

**Request Body:**

```json
{
    "fromService": "my-backend",
    "toService": "my-postgres-db"
}
```

**What happens:**

1. Validates both services belong to the project
2. Detects if target is a database
3. Injects appropriate connection env vars into source service:
    - For databases: `DATABASE_URL`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, etc.
    - For regular services: `SERVICE_NAME_URL`, `SERVICE_NAME_HOST`
4. Updates project's service connection graph

**Example:**

```bash
curl -X POST \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/connections \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "fromService": "my-backend",
    "toService": "my-postgres-db"
  }'
```

**Auto-injected Environment Variables (Postgres example):**

```
DATABASE_URL=postgresql://postgres:password@srv-captain--my-postgres-db:5432/postgres
DB_HOST=srv-captain--my-postgres-db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=auto-generated-password
DB_NAME=postgres
PGUSER=postgres
PGPASSWORD=auto-generated-password
PGDATABASE=postgres
PGHOST=srv-captain--my-postgres-db
PGPORT=5432
```

### **DELETE `/projects/:projectId/connections`**

Disconnect two services (removes from connection graph, but keeps env vars).

**Request Body:**

```json
{
    "fromService": "my-backend",
    "toService": "my-postgres-db"
}
```

**Example:**

```bash
curl -X DELETE \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/connections \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "fromService": "my-backend",
    "toService": "my-postgres-db"
  }'
```

---

## 6. Deployments

### **GET `/projects/:projectId/deployments`**

Get all service deployments for a project, sorted by most recent.

**Response:**

```json
{
    "status": 100,
    "description": "Project deployments retrieved",
    "data": {
        "deployments": [
            {
                "serviceName": "my-backend",
                "displayName": "Backend API",
                "version": 3,
                "deployedImageName": "registry.captain/my-backend:3",
                "timeStamp": "2026-01-06T10:30:00.000Z",
                "gitHash": "abc123def456"
            },
            {
                "serviceName": "my-frontend",
                "displayName": "Web App",
                "version": 5,
                "deployedImageName": "registry.captain/my-frontend:5",
                "timeStamp": "2026-01-06T09:15:00.000Z",
                "gitHash": "def789ghi012"
            }
        ]
    }
}
```

**Example:**

```bash
curl -X GET \
  http://localhost:3000/api/v2/user/projects/my-project-uuid/deployments \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN'
```

---

## 7. GitHub Integration

### **POST `/github/connect`**

Connect a GitHub repository to a project for automated deployments.

**Request Body:**

```json
{
    "projectId": "my-project-uuid",
    "repo": "username/repository",
    "branch": "main",
    "autoDeployEnabled": true
}
```

**Example:**

```bash
curl -X POST \
  http://localhost:3000/api/v2/user/github/connect \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": "my-project-uuid",
    "repo": "myusername/my-repo",
    "branch": "main",
    "autoDeployEnabled": true
  }'
```

### **POST `/github/disconnect`**

Disconnect GitHub repository from a project.

**Request Body:**

```json
{
    "projectId": "my-project-uuid"
}
```

**Example:**

```bash
curl -X POST \
  http://localhost:3000/api/v2/user/github/disconnect \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": "my-project-uuid"
  }'
```

### **POST `/github/webhook`**

GitHub webhook receiver (configure in GitHub repository settings).

**Webhook URL:**

```
https://your-caprover.com/api/v2/user/github/webhook
```

**Events:**

- `ping` - Webhook test
- `push` - Code push event (auto-deploy trigger - to be implemented)

**Example GitHub webhook configuration:**

1. Go to repository → Settings → Webhooks → Add webhook
2. Payload URL: `https://your-caprover.com/api/v2/user/github/webhook`
3. Content type: `application/json`
4. Events: Select "Just the push event"

### **GET `/github/repos`**

List available GitHub repositories (placeholder for GitHub App integration).

**Example:**

```bash
curl -X GET \
  http://localhost:3000/api/v2/user/github/repos \
  -H 'x-captain-auth: YOUR_AUTH_TOKEN'
```

---

## Complete Workflow Example

### 1. Create a Full-Stack Project

```bash
# Step 1: Create a project (assuming you already have one with ID: abc-123)
PROJECT_ID="abc-123"
AUTH_TOKEN="your-auth-token"
BASE_URL="http://localhost:3000/api/v2/user"

# Step 2: Create a PostgreSQL database
curl -X POST \
  $BASE_URL/projects/$PROJECT_ID/databases \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "postgres",
    "name": "app-db",
    "version": "16"
  }'

# Step 3: Create a Redis cache
curl -X POST \
  $BASE_URL/projects/$PROJECT_ID/databases \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "redis",
    "name": "app-cache",
    "version": "7"
  }'

# Step 4: Add backend service to project
curl -X POST \
  $BASE_URL/projects/$PROJECT_ID/services \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "appName": "api-backend",
    "serviceType": "backend",
    "displayName": "API Backend"
  }'

# Step 5: Add frontend service to project
curl -X POST \
  $BASE_URL/projects/$PROJECT_ID/services \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "appName": "web-frontend",
    "serviceType": "frontend",
    "displayName": "Web Frontend"
  }'

# Step 6: Connect backend to database
curl -X POST \
  $BASE_URL/projects/$PROJECT_ID/connections \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "fromService": "api-backend",
    "toService": "app-db"
  }'

# Step 7: Connect backend to Redis
curl -X POST \
  $BASE_URL/projects/$PROJECT_ID/connections \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "fromService": "api-backend",
    "toService": "app-cache"
  }'

# Step 8: Connect frontend to backend
curl -X POST \
  $BASE_URL/projects/$PROJECT_ID/connections \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "fromService": "web-frontend",
    "toService": "api-backend"
  }'

# Step 9: Set project-wide environment variables
curl -X POST \
  $BASE_URL/projects/$PROJECT_ID/env \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "key": "NODE_ENV",
    "value": "production"
  }'

curl -X POST \
  $BASE_URL/projects/$PROJECT_ID/env \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "key": "API_VERSION",
    "value": "v1"
  }'

# Step 10: Connect GitHub for auto-deploy
curl -X POST \
  $BASE_URL/github/connect \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "projectId": "'$PROJECT_ID'",
    "repo": "myusername/my-fullstack-app",
    "branch": "main",
    "autoDeployEnabled": true
  }'

# Step 11: View project overview
curl -X GET \
  $BASE_URL/projects/$PROJECT_ID/overview \
  -H "x-captain-auth: $AUTH_TOKEN"

# Step 12: View all deployments
curl -X GET \
  $BASE_URL/projects/$PROJECT_ID/deployments \
  -H "x-captain-auth: $AUTH_TOKEN"
```

---

## Testing the Implementation

### Test Script

Create a file `test-phase3-api.sh`:

```bash
#!/bin/bash

# Configuration
AUTH_TOKEN="${CAPTAIN_AUTH_TOKEN:-your-token-here}"
BASE_URL="${CAPTAIN_URL:-http://localhost:3000}/api/v2/user"
PROJECT_ID="${PROJECT_ID:-test-project-uuid}"

echo "Testing Phase 3 API Endpoints..."
echo "================================"
echo ""

# Test 1: Get project overview
echo "1. Testing GET /projects/:projectId/overview"
curl -s -X GET \
  "$BASE_URL/projects/$PROJECT_ID/overview" \
  -H "x-captain-auth: $AUTH_TOKEN" | jq .
echo ""

# Test 2: Create database
echo "2. Testing POST /projects/:projectId/databases"
curl -s -X POST \
  "$BASE_URL/projects/$PROJECT_ID/databases" \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "postgres",
    "name": "test-db",
    "version": "16"
  }' | jq .
echo ""

# Test 3: Set project env var
echo "3. Testing POST /projects/:projectId/env"
curl -s -X POST \
  "$BASE_URL/projects/$PROJECT_ID/env" \
  -H "x-captain-auth: $AUTH_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "key": "TEST_VAR",
    "value": "test-value"
  }' | jq .
echo ""

# Test 4: Get project env vars
echo "4. Testing GET /projects/:projectId/env"
curl -s -X GET \
  "$BASE_URL/projects/$PROJECT_ID/env" \
  -H "x-captain-auth: $AUTH_TOKEN" | jq .
echo ""

# Test 5: Get deployments
echo "5. Testing GET /projects/:projectId/deployments"
curl -s -X GET \
  "$BASE_URL/projects/$PROJECT_ID/deployments" \
  -H "x-captain-auth: $AUTH_TOKEN" | jq .
echo ""

echo "================================"
echo "Testing complete!"
```

Run with:

```bash
chmod +x test-phase3-api.sh
export CAPTAIN_AUTH_TOKEN="your-token"
export PROJECT_ID="your-project-uuid"
./test-phase3-api.sh
```

---

## Summary

### Files Created/Modified

**New Files:**

- ✅ `/src/user/EnvVarManager.ts` - Hierarchical env var management
- ✅ `/src/user/ServiceConnectionManager.ts` - Service connection management
- ✅ `/src/routes/user/github/GitHubRouter.ts` - GitHub integration endpoints

**Modified Files:**

- ✅ `/src/routes/user/ProjectsRouter.ts` - Added 11 new endpoints
- ✅ `/src/routes/user/UserRouter.ts` - Registered GitHub router

### New Endpoints (11 total)

**Project Management:**

1. `GET /projects/:projectId/overview` - Project + services + deployments
2. `GET /projects/:projectId/deployments` - All service deployments

**Environment Variables:** 3. `GET /projects/:projectId/env` - Get project env vars 4. `POST /projects/:projectId/env` - Add/update project env var 5. `DELETE /projects/:projectId/env/:key` - Delete project env var

**Service Management:** 6. `POST /projects/:projectId/services` - Add service to project 7. `PUT /projects/:projectId/services/:serviceName` - Update service metadata 8. `DELETE /projects/:projectId/services/:serviceName` - Remove service

**Database Quick-Create:** 9. `POST /projects/:projectId/databases` - Create database (Postgres, MySQL, Redis, MongoDB)

**Service Connections:** 10. `POST /projects/:projectId/connections` - Connect services 11. `DELETE /projects/:projectId/connections` - Disconnect services

**GitHub Integration:** 12. `POST /github/connect` - Connect GitHub repo 13. `POST /github/disconnect` - Disconnect GitHub repo 14. `POST /github/webhook` - GitHub webhook receiver 15. `GET /github/repos` - List repos (placeholder)

### Build Status

✅ **Build successful** - No TypeScript errors, no circular dependencies

---

## Next Steps

### Phase 4: Frontend Implementation

Now that the backend API is complete, you can:

1. **Create React components** for the project dashboard
2. **Implement service cards** with Railway-like styling
3. **Add environment variable management UI**
4. **Create database quick-create wizard**
5. **Visualize service connections** with a dependency graph
6. **Show live deployment logs** with WebSocket

### Future Enhancements

- Implement actual GitHub auto-deployment on webhook push events
- Add GitHub App OAuth flow for repository access
- Support monorepo detection and selective service deployment
- Add deployment status updates to GitHub (pending/success/failed)
- Implement deployment rollback functionality
- Add service metrics and health checks to overview

---

**Implementation Date:** January 6, 2026  
**Phase:** 3 of 7  
**Status:** ✅ Complete
