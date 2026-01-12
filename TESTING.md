# Testing Guide

> Comprehensive testing guide for Railover (CapRover Railway-like UX)

## Table of Contents

- [Backend Testing](#backend-testing)
- [Frontend Testing](#frontend-testing)
- [Integration Testing](#integration-testing)
- [Example Test Data](#example-test-data)
- [Common Issues & Solutions](#common-issues--solutions)
- [Testing Tools](#testing-tools)

---

## Backend Testing

### Setup

```bash
cd /Users/mac/Documents/my-products/railover

# Build the project
npm run build

# Run tests
npm test

# Run specific test file
npx jest tests/utils.test.ts

# Run with pattern matching
npx jest --testNamePattern="dropFirst"

# Run specific test in file
npx jest tests/utils.test.ts -t "larger"
```

---

### Testing API Endpoints with cURL

#### 1. Login and Get Auth Token

```bash
# Login
curl -X POST http://captain.rootdomain.com/api/v2/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password"}' \
  -c cookies.txt \
  -v

# Extract token from response
# Look for "token" in JSON response or check cookies.txt
```

**Expected Response**:

```json
{
    "status": 100,
    "description": "Login succeeded",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

---

#### 2. Test Project Creation

```bash
# Create new project
curl -X POST http://captain.rootdomain.com/api/v2/user/project/register/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "name": "test-project",
    "description": "Test project for Railway-like UX",
    "parentProjectId": ""
  }' \
  -b cookies.txt

# Expected: Status 100 with projectId in response
```

**Success Response**:

```json
{
    "status": 100,
    "description": "Project registered successfully",
    "data": {
        "projectId": "test-project"
    }
}
```

**Error Response** (if project exists):

```json
{
    "status": 1103,
    "description": "Project already exists"
}
```

---

#### 3. Test App/Service Creation

```bash
# Create frontend service
curl -X POST "http://captain.rootdomain.com/api/v2/user/apps/appdefinition/register/?detached=true" \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "appName": "test-frontend",
    "projectId": "test-project",
    "hasPersistentData": false
  }' \
  -b cookies.txt
```

**Valid App Names**:

- ✅ `my-app`
- ✅ `frontend-web`
- ✅ `api-server-v2`
- ❌ `My App` (uppercase)
- ❌ `my_app` (underscore)
- ❌ `my.app` (dot)

---

#### 4. Test Service Type Assignment

```bash
# Update app with service type
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/update/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "appName": "test-frontend",
    "serviceType": "frontend",
    "displayName": "React Frontend",
    "envVars": [
      {"key": "NODE_ENV", "value": "production"}
    ]
  }' \
  -b cookies.txt
```

---

#### 5. Test Environment Variables (Hierarchical)

```bash
# Add project-level env var
curl -X POST http://captain.rootdomain.com/api/v2/user/project/update/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "projectDefinition": {
      "id": "test-project",
      "name": "test-project",
      "description": "Test project",
      "sharedEnvVars": [
        {"key": "DATABASE_URL", "value": "postgresql://user:pass@postgres:5432/db"},
        {"key": "API_KEY", "value": "shared-api-key"}
      ]
    }
  }' \
  -b cookies.txt

# Add service-specific env var (overrides project var if same key)
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/update/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "appName": "test-frontend",
    "envVars": [
      {"key": "API_KEY", "value": "frontend-specific-key"},
      {"key": "PORT", "value": "3000"}
    ]
  }' \
  -b cookies.txt

# Result: test-frontend will have:
# - DATABASE_URL (from project)
# - API_KEY = "frontend-specific-key" (service overrides project)
# - PORT = "3000" (service-specific)
```

---

#### 6. Test Deployment

```bash
# Deploy with Captain Definition (inline Dockerfile)
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appData/test-frontend/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "captainDefinitionContent": "{\"schemaVersion\":2,\"dockerfileLines\":[\"FROM nginx:alpine\",\"COPY . /usr/share/nginx/html\",\"EXPOSE 80\",\"CMD [\\\"nginx\\\", \\\"-g\\\", \\\"daemon off;\\\"]\"]}"
  }' \
  -b cookies.txt

# Expected: Status 101 (Deploy started)
```

**Deploy with Tarball**:

```bash
# Create test tarball
mkdir test-app
echo "Hello CapRover!" > test-app/index.html
tar -czf test-app.tar.gz test-app/

# Upload
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appData/test-frontend/update \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -F "sourceFile=@test-app.tar.gz" \
  -b cookies.txt
```

---

#### 7. Test Get All Apps

```bash
# Get all apps with service types
curl http://captain.rootdomain.com/api/v2/user/apps/appdefinition/ \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -b cookies.txt | jq '.data.appDefinitions[] | {appName, serviceType, displayName, projectId}'

# Example output:
# {
#   "appName": "test-frontend",
#   "serviceType": "frontend",
#   "displayName": "React Frontend",
#   "projectId": "test-project"
# }
```

---

#### 8. Test One-Click Database Creation

```bash
# List available templates
curl http://captain.rootdomain.com/api/v2/user/oneclick/template/list \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -b cookies.txt

# Deploy PostgreSQL
curl -X POST http://captain.rootdomain.com/api/v2/user/oneclick/deploy \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "appName": "postgres-db",
    "projectId": "test-project",
    "oneClickApp": {
      "name": "postgresql",
      "variables": [
        {"id": "$$cap_postgres_version", "value": "16"},
        {"id": "$$cap_pg_pass", "value": "securePassword123"}
      ]
    }
  }' \
  -b cookies.txt
```

---

#### 9. Test Custom Domains

```bash
# Add custom domain
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/customdomain/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "appName": "test-frontend",
    "customDomain": "example.com"
  }' \
  -b cookies.txt

# Enable SSL for custom domain
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/enablecustomdomainssl/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "appName": "test-frontend",
    "customDomain": "example.com"
  }' \
  -b cookies.txt
```

---

#### 10. Test App Logs

```bash
# Get runtime logs
curl "http://captain.rootdomain.com/api/v2/user/apps/appData/test-frontend/logs?rows=100" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -b cookies.txt
```

---

#### 11. Test Cleanup

```bash
# Delete app
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/delete/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "appName": "test-frontend",
    "volumes": []
  }' \
  -b cookies.txt

# Delete project
curl -X POST http://captain.rootdomain.com/api/v2/user/project/delete/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: YOUR_AUTH_TOKEN" \
  -d '{
    "projectIds": ["test-project"]
  }' \
  -b cookies.txt
```

---

### Unit Testing

#### Running Jest Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npx jest tests/utils.test.ts

# Watch mode
npm test -- --watch
```

#### Example Test Structure

**File**: `tests/service-type.test.ts` (Example)

```typescript
import { ServiceType, SERVICE_TYPE_METADATA } from '../src/models/ServiceType'

test('ServiceType enum has all expected values', () => {
    expect(ServiceType.FRONTEND).toBe('frontend')
    expect(ServiceType.BACKEND).toBe('backend')
    expect(ServiceType.DATABASE).toBe('database')
    expect(ServiceType.WORKER).toBe('worker')
    expect(ServiceType.CRON).toBe('cron')
})

test('SERVICE_TYPE_METADATA has correct colors', () => {
    expect(SERVICE_TYPE_METADATA[ServiceType.FRONTEND].color).toBe('#8b5cf6')
    expect(SERVICE_TYPE_METADATA[ServiceType.BACKEND].color).toBe('#3b82f6')
    expect(SERVICE_TYPE_METADATA[ServiceType.DATABASE].color).toBe('#10b981')
})

test('Database services are marked as stateful', () => {
    expect(SERVICE_TYPE_METADATA[ServiceType.DATABASE].isStateful).toBe(true)
    expect(SERVICE_TYPE_METADATA[ServiceType.FRONTEND].isStateful).toBe(false)
})
```

---

## Frontend Testing

### Manual Testing with Browser

#### 1. Login

```
Navigate to: http://captain.rootdomain.com
Enter password
Check DevTools → Application → Cookies for auth token
```

#### 2. Create Project

```
1. Go to Projects page (NEW in Railway-like UX)
2. Click "Create New Project"
3. Enter:
   - Name: test-project
   - Description: Test project for Railway UX
4. Click "Create"
5. Verify project appears in list
```

#### 3. Create Service

```
1. Click on "test-project"
2. Click "Add Service"
3. Choose service type (Frontend, Backend, Database, Worker)
4. Enter service name: "my-api"
5. Click "Create"
6. Verify service card appears in project dashboard
```

#### 4. Test Environment Variables

```
1. Go to Project → Environment tab
2. Add project-level var:
   - Key: DATABASE_URL
   - Value: postgresql://...
3. Go to specific service
4. Add service-level var:
   - Key: PORT
   - Value: 3000
5. Verify both vars appear in service env list
```

#### 5. Test Deployment

```
1. Go to service details
2. Click "Deployment" tab
3. Choose deployment method:
   - Git: Enter repo URL, branch, token
   - Tarball: Upload .tar.gz file
   - Dockerfile: Paste Dockerfile content
4. Click "Deploy"
5. Watch build logs in real-time
6. Verify deployment success
```

#### 6. Test Service Types

```
1. Create multiple services with different types:
   - Frontend: React app
   - Backend: Node.js API
   - Database: PostgreSQL
   - Worker: Background job
2. Verify color coding:
   - Frontend: Purple (#8b5cf6)
   - Backend: Blue (#3b82f6)
   - Database: Green (#10b981)
   - Worker: Orange (#f59e0b)
3. Verify grouping in project dashboard
```

---

### Browser DevTools Testing

#### Network Tab

```javascript
// Filter by: api/v2/user
// Check request headers:
{
  "x-namespace": "captain",
  "x-captain-auth": "your-token",
  "Content-Type": "application/json"
}

// Check response status codes:
// 200 - Success
// 400 - Bad request
// 401 - Unauthorized
// 500 - Server error
```

#### Console Testing

```javascript
// Get all apps
fetch('http://captain.rootdomain.com/api/v2/user/apps/appdefinition/', {
    headers: {
        'x-namespace': 'captain',
        'x-captain-auth': 'YOUR_TOKEN',
    },
    credentials: 'include',
})
    .then((r) => r.json())
    .then((data) => console.log(data.data.appDefinitions))

// Create app
fetch(
    'http://captain.rootdomain.com/api/v2/user/apps/appdefinition/register/?detached=true',
    {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-namespace': 'captain',
            'x-captain-auth': 'YOUR_TOKEN',
        },
        credentials: 'include',
        body: JSON.stringify({
            appName: 'test-app',
            projectId: 'test-project',
            hasPersistentData: false,
        }),
    }
)
    .then((r) => r.json())
    .then(console.log)
```

---

## Integration Testing

### Full MERN Stack Test Scenario

#### Scenario: Deploy a MERN application

**Step 1: Create Project**

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/project/register/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "name": "mern-app",
    "description": "MERN stack application"
  }' \
  -b cookies.txt
```

**Step 2: Create MongoDB Database**

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/oneclick/deploy \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "appName": "mongodb",
    "projectId": "mern-app",
    "oneClickApp": {
      "name": "mongodb",
      "variables": [
        {"id": "$$cap_mongo_version", "value": "7"},
        {"id": "$$cap_mongo_password", "value": "mongopass123"}
      ]
    }
  }' \
  -b cookies.txt
```

**Step 3: Create Backend Service**

```bash
# Create app
curl -X POST "http://captain.rootdomain.com/api/v2/user/apps/appdefinition/register/?detached=true" \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "appName": "backend",
    "projectId": "mern-app",
    "hasPersistentData": false
  }' \
  -b cookies.txt

# Configure as backend service
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/update/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "appName": "backend",
    "serviceType": "backend",
    "displayName": "Express API",
    "connectedServices": ["mongodb"],
    "envVars": [
      {"key": "MONGODB_URI", "value": "mongodb://mongodb:27017/app"},
      {"key": "PORT", "value": "3000"}
    ]
  }' \
  -b cookies.txt
```

**Step 4: Create Frontend Service**

```bash
# Create app
curl -X POST "http://captain.rootdomain.com/api/v2/user/apps/appdefinition/register/?detached=true" \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "appName": "frontend",
    "projectId": "mern-app",
    "hasPersistentData": false
  }' \
  -b cookies.txt

# Configure as frontend service
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/update/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: $TOKEN" \
  -d '{
    "appName": "frontend",
    "serviceType": "frontend",
    "displayName": "React App",
    "connectedServices": ["backend"],
    "envVars": [
      {"key": "REACT_APP_API_URL", "value": "http://backend.captain.rootdomain.com"}
    ]
  }' \
  -b cookies.txt
```

**Step 5: Verify Setup**

```bash
# Get all apps in project
curl http://captain.rootdomain.com/api/v2/user/apps/appdefinition/ \
  -H "x-namespace: captain" \
  -H "x-captain-auth: $TOKEN" \
  -b cookies.txt | jq '.data.appDefinitions[] | select(.projectId == "mern-app") | {appName, serviceType, displayName}'

# Expected output:
# {
#   "appName": "mongodb",
#   "serviceType": "database",
#   "displayName": "MongoDB"
# }
# {
#   "appName": "backend",
#   "serviceType": "backend",
#   "displayName": "Express API"
# }
# {
#   "appName": "frontend",
#   "serviceType": "frontend",
#   "displayName": "React App"
# }
```

---

## Example Test Data

### Valid Project Data

```json
{
    "name": "ecommerce-platform",
    "description": "Full-featured e-commerce platform",
    "parentProjectId": "",
    "githubIntegration": {
        "repo": "user/ecommerce-monorepo",
        "branch": "main",
        "autoDeployEnabled": true
    },
    "sharedEnvVars": [
        { "key": "NODE_ENV", "value": "production" },
        { "key": "LOG_LEVEL", "value": "info" }
    ],
    "services": [
        {
            "appName": "web",
            "serviceType": "frontend",
            "displayName": "Next.js Frontend",
            "githubPath": "apps/web",
            "connections": ["api"],
            "order": 1
        },
        {
            "appName": "api",
            "serviceType": "backend",
            "displayName": "GraphQL API",
            "githubPath": "apps/api",
            "connections": ["postgres", "redis"],
            "order": 2
        },
        {
            "appName": "postgres",
            "serviceType": "database",
            "displayName": "PostgreSQL",
            "connections": [],
            "order": 3
        },
        {
            "appName": "redis",
            "serviceType": "database",
            "displayName": "Redis Cache",
            "connections": [],
            "order": 4
        },
        {
            "appName": "worker",
            "serviceType": "worker",
            "displayName": "Background Jobs",
            "githubPath": "apps/worker",
            "connections": ["postgres", "redis"],
            "order": 5
        }
    ]
}
```

### Valid App Definition

```json
{
    "appName": "api-server",
    "projectId": "ecommerce-platform",
    "serviceType": "backend",
    "displayName": "REST API",
    "description": "Main REST API server",
    "hasPersistentData": false,
    "notExposeAsWebApp": false,
    "containerHttpPort": 3000,
    "instanceCount": 2,
    "envVars": [
        { "key": "PORT", "value": "3000" },
        {
            "key": "DATABASE_URL",
            "value": "postgresql://user:pass@postgres:5432/db"
        },
        { "key": "REDIS_URL", "value": "redis://redis:6379" }
    ],
    "volumes": [
        {
            "containerPath": "/app/uploads",
            "volumeName": "api-uploads"
        }
    ],
    "ports": [
        {
            "containerPort": 3000,
            "hostPort": 3000,
            "protocol": "tcp"
        }
    ],
    "connectedServices": ["postgres", "redis"],
    "forceSsl": true,
    "websocketSupport": false
}
```

---

## Common Issues & Solutions

### Issue 1: "App name must be lowercase"

**Error**:

```json
{
    "status": 1104,
    "description": "App name must be lowercase and alphanumeric with hyphens only"
}
```

**Solution**:

```bash
# ❌ Bad
"appName": "My API"
"appName": "my_api"

# ✅ Good
"appName": "my-api"
"appName": "api-v2"
```

---

### Issue 2: "Not authorized"

**Error**:

```json
{
    "status": 1102,
    "description": "Not authorized"
}
```

**Solutions**:

1. Check auth token in headers
2. Verify cookies are sent (`-b cookies.txt`)
3. Re-login to get new token
4. Check `x-namespace` header is set to `captain`

---

### Issue 3: "Build failed"

**Error**:

```json
{
    "status": 1109,
    "description": "Build failed: Docker build error"
}
```

**Solutions**:

1. Check build logs:
    ```bash
    curl http://captain.rootdomain.com/api/v2/user/apps/appData/my-app/logs \
      -H "x-namespace: captain" \
      -H "x-captain-auth: $TOKEN"
    ```
2. Verify Dockerfile syntax
3. Check base image exists
4. Ensure sufficient disk space

---

### Issue 4: Environment variables not showing in service

**Problem**: Service-level env vars don't include project-level vars

**Solution**:

1. Project-level vars are NOT automatically merged in current implementation
2. This is a planned feature for Railway-like UX migration
3. For now, manually add project vars to each service

---

### Issue 5: Custom domain SSL fails

**Error**:

```json
{
    "status": 1107,
    "description": "Verification failed"
}
```

**Solutions**:

1. Verify DNS points to CapRover server
2. Wait for DNS propagation (up to 48 hours)
3. Ensure domain is added before enabling SSL
4. Check Let's Encrypt rate limits

---

## Testing Tools

### Postman Collection

**Import this collection**:

```json
{
    "info": {
        "name": "CapRover API",
        "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    "item": [
        {
            "name": "Login",
            "request": {
                "method": "POST",
                "header": [
                    { "key": "Content-Type", "value": "application/json" }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\"password\":\"{{password}}\"}"
                },
                "url": "{{base_url}}/api/v2/login"
            }
        },
        {
            "name": "Get All Projects",
            "request": {
                "method": "GET",
                "header": [
                    { "key": "x-namespace", "value": "captain" },
                    { "key": "x-captain-auth", "value": "{{auth_token}}" }
                ],
                "url": "{{base_url}}/api/v2/user/project/"
            }
        },
        {
            "name": "Create Project",
            "request": {
                "method": "POST",
                "header": [
                    { "key": "Content-Type", "value": "application/json" },
                    { "key": "x-namespace", "value": "captain" },
                    { "key": "x-captain-auth", "value": "{{auth_token}}" }
                ],
                "body": {
                    "mode": "raw",
                    "raw": "{\"name\":\"test-project\",\"description\":\"Test\"}"
                },
                "url": "{{base_url}}/api/v2/user/project/register/"
            }
        }
    ]
}
```

**Environment Variables**:

- `base_url`: `http://captain.rootdomain.com`
- `auth_token`: Your JWT token
- `password`: Your CapRover password

---

### Testing Script

**File**: `scripts/test-api.sh`

```bash
#!/bin/bash

# Configuration
BASE_URL="http://captain.rootdomain.com"
PASSWORD="your-password"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Login and get token
echo "Logging in..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/v2/login" \
  -H "Content-Type: application/json" \
  -d "{\"password\":\"$PASSWORD\"}" \
  -c cookies.txt | jq -r '.data.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}Login failed${NC}"
  exit 1
fi

echo -e "${GREEN}Login successful${NC}"
echo "Token: $TOKEN"

# Create project
echo "\nCreating project..."
PROJECT_RESULT=$(curl -s -X POST "$BASE_URL/api/v2/user/project/register/" \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: $TOKEN" \
  -d '{"name":"test-project-'$(date +%s)'","description":"Automated test"}' \
  -b cookies.txt)

PROJECT_ID=$(echo $PROJECT_RESULT | jq -r '.data.projectId')
echo "Project ID: $PROJECT_ID"

# Create app
echo "\nCreating app..."
APP_RESULT=$(curl -s -X POST "$BASE_URL/api/v2/user/apps/appdefinition/register/?detached=true" \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: $TOKEN" \
  -d "{\"appName\":\"test-app-$(date +%s)\",\"projectId\":\"$PROJECT_ID\",\"hasPersistentData\":false}" \
  -b cookies.txt)

echo $APP_RESULT | jq

echo -e "\n${GREEN}All tests passed!${NC}"
```

**Run**:

```bash
chmod +x scripts/test-api.sh
./scripts/test-api.sh
```

---

## Automated Testing Checklist

### Pre-deployment Tests

- [ ] Unit tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] No circular dependencies (`madge --circular`)

### API Tests

- [ ] Can login successfully
- [ ] Can create project
- [ ] Can create app/service
- [ ] Can update service type
- [ ] Can deploy app
- [ ] Can add custom domain
- [ ] Can enable SSL
- [ ] Can delete app
- [ ] Can delete project

### Frontend Tests

- [ ] Login page loads
- [ ] Dashboard displays
- [ ] Apps list shows all apps
- [ ] Can navigate to app details
- [ ] Deployment tab works
- [ ] Logs display correctly
- [ ] Can update environment variables

### Integration Tests

- [ ] Can deploy full MERN stack
- [ ] Services can communicate
- [ ] Environment variables propagate
- [ ] Database connections work
- [ ] SSL certificates issue successfully

---

**Last Updated**: January 6, 2026
