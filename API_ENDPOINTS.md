# API Endpoints Documentation

> Comprehensive API documentation for Railover (CapRover Railway-like UX)

## Table of Contents

- [Authentication](#authentication)
- [Projects API](#projects-api)
- [Apps/Services API](#appsservices-api)
- [Deployment API](#deployment-api)
- [Environment Variables API](#environment-variables-api)
- [One-Click Apps API](#one-click-apps-api)
- [System API](#system-api)
- [Status Codes](#status-codes)
- [Error Responses](#error-responses)

---

## Authentication

All API endpoints (except `/login` and `/public/*`) require authentication via a JWT token stored in cookies.

### Login

**Endpoint**: `POST /api/v2/login`

**Description**: Authenticate user and receive JWT token

**Request Body**:

```json
{
    "password": "your-password"
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "Login succeeded",
    "data": {
        "token": "jwt-token-here"
    }
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password"}' \
  -c cookies.txt
```

**Error Responses**:

- `1105` - Wrong password
- `1113` - Password back-off (too many failed attempts)
- `1114` - OTP required (2FA enabled)

---

## Projects API

### Get All Projects

**Endpoint**: `GET /api/v2/user/project/`

**Description**: Retrieve all projects for the authenticated user

**Authentication**: Required (Cookie)

**Response** (200):

```json
{
    "status": 100,
    "description": "Projects are retrieved.",
    "data": {
        "projects": [
            {
                "id": "proj-123",
                "name": "My MERN App",
                "description": "Full-stack MERN application",
                "parentProjectId": "",
                "githubIntegration": {
                    "repo": "user/repo",
                    "branch": "main",
                    "installationId": "12345",
                    "autoDeployEnabled": true
                },
                "sharedEnvVars": [
                    {
                        "key": "NODE_ENV",
                        "value": "production"
                    }
                ],
                "services": [
                    {
                        "appName": "frontend",
                        "serviceType": "frontend",
                        "displayName": "React Frontend",
                        "githubPath": "packages/web",
                        "connections": ["backend"],
                        "order": 1
                    }
                ],
                "createdAt": "2026-01-01T00:00:00.000Z",
                "updatedAt": "2026-01-06T00:00:00.000Z"
            }
        ]
    }
}
```

**cURL Example**:

```bash
curl http://captain.rootdomain.com/api/v2/user/project/ \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -b cookies.txt
```

---

### Register New Project

**Endpoint**: `POST /api/v2/user/project/register/`

**Description**: Create a new project

**Authentication**: Required

**Request Body**:

```json
{
    "name": "My Project",
    "description": "Project description here",
    "parentProjectId": ""
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "Project registered successfully",
    "data": {
        "projectId": "proj-abc123"
    }
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/project/register/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "name": "My Project",
    "description": "Full-stack application",
    "parentProjectId": ""
  }' \
  -b cookies.txt
```

**Status Codes**:

- `100` - Success
- `1103` - Project already exists
- `1104` - Invalid project name
- `1108` - Illegal operation

---

### Update Project

**Endpoint**: `POST /api/v2/user/project/update/`

**Description**: Update project details

**Authentication**: Required

**Request Body**:

```json
{
    "projectDefinition": {
        "id": "proj-123",
        "name": "Updated Project Name",
        "description": "Updated description",
        "parentProjectId": "",
        "githubIntegration": {
            "repo": "user/repo",
            "branch": "main",
            "autoDeployEnabled": true
        },
        "sharedEnvVars": [
            {
                "key": "DATABASE_URL",
                "value": "postgresql://..."
            }
        ],
        "services": [
            {
                "appName": "api",
                "serviceType": "backend",
                "displayName": "API Server",
                "connections": ["postgres"]
            }
        ]
    }
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "Project Saved"
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/project/update/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "projectDefinition": {
      "id": "proj-123",
      "name": "My Updated Project",
      "description": "New description"
    }
  }' \
  -b cookies.txt
```

---

### Delete Projects

**Endpoint**: `POST /api/v2/user/project/delete/`

**Description**: Delete one or more projects

**Authentication**: Required

**Request Body**:

```json
{
    "projectIds": ["proj-123", "proj-456"]
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "Project deleted"
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/project/delete/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{"projectIds": ["proj-123"]}' \
  -b cookies.txt
```

---

## Apps/Services API

### Get All App Definitions

**Endpoint**: `GET /api/v2/user/apps/appdefinition/`

**Description**: Retrieve all app/service definitions

**Authentication**: Required

**Response** (200):

```json
{
    "status": 100,
    "description": "App definitions retrieved",
    "data": {
        "appDefinitions": [
            {
                "appName": "my-frontend",
                "projectId": "proj-123",
                "serviceType": "frontend",
                "displayName": "React App",
                "githubPath": "",
                "connectedServices": ["my-backend"],
                "hasPersistentData": false,
                "notExposeAsWebApp": false,
                "containerHttpPort": 80,
                "instanceCount": 1,
                "envVars": [
                    {
                        "key": "API_URL",
                        "value": "https://api.example.com"
                    }
                ],
                "customDomain": [
                    {
                        "publicDomain": "example.com",
                        "hasSsl": true
                    }
                ],
                "versions": [
                    {
                        "version": 5,
                        "deployedImageName": "captain/my-frontend:5",
                        "timeStamp": "2026-01-06T10:30:00.000Z",
                        "gitHash": "abc123"
                    }
                ],
                "deployedVersion": 5,
                "isAppBuilding": false
            }
        ],
        "rootDomain": "captain.example.com",
        "defaultNginxConfig": "..."
    }
}
```

**cURL Example**:

```bash
curl http://captain.rootdomain.com/api/v2/user/apps/appdefinition/ \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -b cookies.txt
```

---

### Register New App/Service

**Endpoint**: `POST /api/v2/user/apps/appdefinition/register/`

**Description**: Create a new app/service

**Authentication**: Required

**Request Body**:

```json
{
    "appName": "my-api",
    "projectId": "proj-123",
    "hasPersistentData": false
}
```

**Query Parameters**:

- `detached` (optional) - If true, creates app without waiting for build

**Response** (200):

```json
{
    "status": 100,
    "description": "App registered successfully"
}
```

**cURL Example**:

```bash
curl -X POST "http://captain.rootdomain.com/api/v2/user/apps/appdefinition/register/?detached=true" \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "appName": "my-api",
    "projectId": "proj-123",
    "hasPersistentData": false
  }' \
  -b cookies.txt
```

**Status Codes**:

- `100` - Success
- `1103` - App already exists
- `1104` - Invalid app name (must be lowercase alphanumeric + hyphens)

---

### Update App/Service Configuration

**Endpoint**: `POST /api/v2/user/apps/appdefinition/update/`

**Description**: Update app/service configuration (including service type, connections, etc.)

**Authentication**: Required

**Request Body**:

```json
{
    "appName": "my-api",
    "projectId": "proj-123",
    "description": "Main API server",
    "instanceCount": 2,
    "containerHttpPort": 3000,
    "envVars": [
        {
            "key": "DATABASE_URL",
            "value": "postgresql://user:pass@postgres:5432/db"
        },
        {
            "key": "PORT",
            "value": "3000"
        }
    ],
    "volumes": [
        {
            "containerPath": "/app/data",
            "volumeName": "my-api-data"
        }
    ],
    "ports": [
        {
            "containerPort": 3000,
            "hostPort": 3000,
            "protocol": "tcp"
        }
    ],
    "notExposeAsWebApp": false,
    "forceSsl": true,
    "websocketSupport": false
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "Updated app definition"
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/update/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "appName": "my-api",
    "envVars": [
      {"key": "NODE_ENV", "value": "production"}
    ],
    "instanceCount": 2
  }' \
  -b cookies.txt
```

---

### Delete App/Service

**Endpoint**: `POST /api/v2/user/apps/appdefinition/delete/`

**Description**: Delete one or more apps/services

**Authentication**: Required

**Request Body** (single app):

```json
{
    "appName": "my-api",
    "volumes": ["vol-123"]
}
```

**Request Body** (multiple apps):

```json
{
    "appNames": ["my-api", "my-worker"],
    "volumes": []
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "App is deleted"
}
```

**Response** (102 - Partial success):

```json
{
    "status": 102,
    "description": "App is deleted. Some volumes were not safe to delete. Delete skipped for: vol-123",
    "data": {
        "volumesFailedToDelete": ["vol-123"]
    }
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/delete/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "appName": "my-api",
    "volumes": []
  }' \
  -b cookies.txt
```

---

### Rename App

**Endpoint**: `POST /api/v2/user/apps/appdefinition/rename/`

**Description**: Rename an app/service

**Authentication**: Required

**Request Body**:

```json
{
    "oldAppName": "my-old-api",
    "newAppName": "my-new-api"
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "AppName is renamed"
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/rename/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "oldAppName": "old-name",
    "newAppName": "new-name"
  }' \
  -b cookies.txt
```

---

## Deployment API

### Get App Logs

**Endpoint**: `GET /api/v2/user/apps/appData/:appName/logs`

**Description**: Retrieve application runtime logs

**Authentication**: Required

**URL Parameters**:

- `appName` (required) - Name of the app

**Query Parameters**:

- `rows` (optional) - Number of log lines to retrieve (default: 100)

**Response** (200):

```json
{
    "status": 100,
    "description": "App logs retrieved",
    "data": {
        "logs": "2026-01-06T10:00:00.000Z Server started on port 3000\n2026-01-06T10:01:00.000Z Request received..."
    }
}
```

**cURL Example**:

```bash
curl "http://captain.rootdomain.com/api/v2/user/apps/appData/my-api/logs?rows=200" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -b cookies.txt
```

---

### Get App Data

**Endpoint**: `GET /api/v2/user/apps/appData/:appName/`

**Description**: Get app-specific data and metrics

**Authentication**: Required

**Response** (200):

```json
{
    "status": 100,
    "description": "App data retrieved",
    "data": {
        "isAppBuilding": false,
        "logs": "...",
        "buildLogs": "..."
    }
}
```

**cURL Example**:

```bash
curl http://captain.rootdomain.com/api/v2/user/apps/appData/my-api/ \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -b cookies.txt
```

---

### Deploy via Git

**Endpoint**: `POST /api/v2/user/apps/appData/:appName/`

**Description**: Deploy app from Git repository

**Authentication**: Required

**Request Body**:

```json
{
    "captainDefinitionContent": "{\"schemaVersion\":2,\"dockerfileLines\":[\"FROM node:18\",\"WORKDIR /app\",\"COPY package*.json ./\",\"RUN npm install\",\"COPY . .\",\"CMD [\\\"npm\\\", \\\"start\\\"]\"]}"
}
```

Or with Git repository:

```json
{
    "gitHash": "abc123def456",
    "repoInfo": {
        "repo": "https://github.com/user/repo",
        "branch": "main",
        "user": "git-username",
        "password": "github-token"
    }
}
```

**Response** (101):

```json
{
    "status": 101,
    "description": "Deploy started"
}
```

**cURL Example** (Captain Definition):

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appData/my-api/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "captainDefinitionContent": "{\"schemaVersion\":2,\"dockerfileLines\":[\"FROM node:18\",\"WORKDIR /app\",\"COPY . .\",\"RUN npm install\",\"CMD [\\\"npm\\\", \\\"start\\\"]\"]}"
  }' \
  -b cookies.txt
```

---

### Deploy via Tarball Upload

**Endpoint**: `POST /api/v2/user/apps/appData/:appName/update`

**Description**: Deploy app by uploading a tarball

**Authentication**: Required

**Content-Type**: `multipart/form-data`

**Form Data**:

- `sourceFile` - Tarball file (.tar)

**Response** (101):

```json
{
    "status": 101,
    "description": "Deploy started"
}
```

**cURL Example**:

```bash
tar -czf app.tar.gz .
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appData/my-api/update \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -F "sourceFile=@app.tar.gz" \
  -b cookies.txt
```

---

## Environment Variables API

### Get App Environment Variables

Environment variables are part of the app definition. Use:

**Endpoint**: `GET /api/v2/user/apps/appdefinition/`

Filter for specific app in response.

### Update App Environment Variables

**Endpoint**: `POST /api/v2/user/apps/appdefinition/update/`

**Request Body**:

```json
{
    "appName": "my-api",
    "envVars": [
        {
            "key": "DATABASE_URL",
            "value": "postgresql://..."
        },
        {
            "key": "API_KEY",
            "value": "secret-key-here"
        }
    ]
}
```

**Note**: Environment variables in the Project definition (`sharedEnvVars`) are inherited by all services in that project. Service-level env vars override project-level vars.

---

## One-Click Apps API

### Get Available Templates

**Endpoint**: `GET /api/v2/user/oneclick/template/list`

**Description**: Get list of available one-click app templates

**Authentication**: Required

**Response** (200):

```json
{
  "status": 100,
  "description": "Templates retrieved",
  "data": {
    "oneClickApps": [
      {
        "name": "PostgreSQL",
        "displayName": "PostgreSQL Database",
        "description": "PostgreSQL 16.x database",
        "dockerCompose": {...}
      }
    ]
  }
}
```

**cURL Example**:

```bash
curl http://captain.rootdomain.com/api/v2/user/oneclick/template/list \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -b cookies.txt
```

---

### Get Repositories

**Endpoint**: `GET /api/v2/user/oneclick/repositories/`

**Description**: Get list of one-click app repositories

**Authentication**: Required

**Response** (200):

```json
{
    "status": 100,
    "description": "Repositories retrieved",
    "data": {
        "repositories": [
            {
                "url": "https://github.com/caprover/one-click-apps",
                "name": "Official Apps"
            }
        ]
    }
}
```

---

### Deploy One-Click App

**Endpoint**: `POST /api/v2/user/oneclick/deploy`

**Description**: Deploy a one-click app (e.g., database)

**Authentication**: Required

**Request Body**:

```json
{
    "appName": "postgres-db",
    "projectId": "proj-123",
    "oneClickApp": {
        "name": "postgresql",
        "variables": [
            {
                "id": "$$cap_postgres_version",
                "label": "Postgres Version",
                "defaultValue": "16",
                "value": "16"
            },
            {
                "id": "$$cap_pg_pass",
                "label": "Database Password",
                "value": "secure-password"
            }
        ]
    }
}
```

**Response** (101):

```json
{
    "status": 101,
    "description": "Deploy started"
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/oneclick/deploy \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "appName": "postgres-db",
    "projectId": "proj-123",
    "oneClickApp": {
      "name": "postgresql",
      "variables": [
        {"id": "$$cap_postgres_version", "value": "16"},
        {"id": "$$cap_pg_pass", "value": "mypassword123"}
      ]
    }
  }' \
  -b cookies.txt
```

---

## System API

### Get System Info

**Endpoint**: `GET /api/v2/user/system/info/`

**Description**: Get CapRover system information

**Authentication**: Required

**Response** (200):

```json
{
    "status": 100,
    "description": "System info retrieved",
    "data": {
        "rootDomain": "captain.example.com",
        "hasRootSsl": true,
        "forceSsl": true,
        "versionInfo": {
            "version": "1.10.1",
            "gitHash": "abc123"
        }
    }
}
```

**cURL Example**:

```bash
curl http://captain.rootdomain.com/api/v2/user/system/info/ \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -b cookies.txt
```

---

### Create Backup

**Endpoint**: `POST /api/v2/user/system/createbackup/`

**Description**: Create a backup of CapRover configuration

**Authentication**: Required

**Response** (200):

```json
{
    "status": 100,
    "description": "Backup created",
    "data": {
        "downloadToken": "token-123"
    }
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/system/createbackup/ \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -b cookies.txt
```

---

## Custom Domains API

### Add Custom Domain

**Endpoint**: `POST /api/v2/user/apps/appdefinition/customdomain/`

**Description**: Add a custom domain to an app

**Authentication**: Required

**Request Body**:

```json
{
    "appName": "my-frontend",
    "customDomain": "example.com"
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "Custom domain is enabled for: my-frontend at example.com"
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/customdomain/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "appName": "my-frontend",
    "customDomain": "example.com"
  }' \
  -b cookies.txt
```

---

### Enable SSL for Custom Domain

**Endpoint**: `POST /api/v2/user/apps/appdefinition/enablecustomdomainssl/`

**Description**: Enable Let's Encrypt SSL for custom domain

**Authentication**: Required

**Request Body**:

```json
{
    "appName": "my-frontend",
    "customDomain": "example.com"
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "Custom domain SSL is enabled for: my-frontend at example.com"
}
```

**cURL Example**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/enablecustomdomainssl/ \
  -H "Content-Type: application/json" \
  -H "x-namespace: captain" \
  -H "x-captain-auth: your-auth-token" \
  -d '{
    "appName": "my-frontend",
    "customDomain": "example.com"
  }' \
  -b cookies.txt
```

---

### Remove Custom Domain

**Endpoint**: `POST /api/v2/user/apps/appdefinition/removecustomdomain/`

**Description**: Remove a custom domain from an app

**Authentication**: Required

**Request Body**:

```json
{
    "appName": "my-frontend",
    "customDomain": "example.com"
}
```

**Response** (200):

```json
{
    "status": 100,
    "description": "Custom domain is removed for: my-frontend at example.com"
}
```

---

## Status Codes

| Code   | Constant                               | Description                     |
| ------ | -------------------------------------- | ------------------------------- |
| `100`  | `STATUS_OK`                            | Operation successful            |
| `101`  | `STATUS_OK_DEPLOY_STARTED`             | Deployment started successfully |
| `102`  | `STATUS_OK_PARTIALLY`                  | Operation partially successful  |
| `1000` | `STATUS_ERROR_GENERIC`                 | Generic error                   |
| `1001` | `STATUS_ERROR_CAPTAIN_NOT_INITIALIZED` | CapRover not initialized        |
| `1101` | `STATUS_ERROR_USER_NOT_INITIALIZED`    | User not initialized            |
| `1102` | `STATUS_ERROR_NOT_AUTHORIZED`          | Not authorized                  |
| `1103` | `STATUS_ERROR_ALREADY_EXIST`           | Resource already exists         |
| `1104` | `STATUS_ERROR_BAD_NAME`                | Invalid name format             |
| `1105` | `WRONG_PASSWORD`                       | Incorrect password              |
| `1106` | `STATUS_AUTH_TOKEN_INVALID`            | Invalid auth token              |
| `1107` | `VERIFICATION_FAILED`                  | Verification failed             |
| `1108` | `ILLEGAL_OPERATION`                    | Operation not allowed           |
| `1109` | `BUILD_ERROR`                          | Build/deployment error          |
| `1110` | `ILLEGAL_PARAMETER`                    | Invalid parameter               |
| `1111` | `NOT_FOUND`                            | Resource not found              |
| `1112` | `AUTHENTICATION_FAILED`                | Authentication failed           |
| `1113` | `STATUS_PASSWORD_BACK_OFF`             | Too many failed login attempts  |
| `1114` | `STATUS_ERROR_OTP_REQUIRED`            | OTP/2FA required                |
| `1115` | `STATUS_ERROR_PRO_API_KEY_INVALIDATED` | Pro API key invalid             |
| `1116` | `STATUS_ERROR_NGINX_VALIDATION_FAILED` | NGINX config validation failed  |

---

## Error Responses

All error responses follow this format:

```json
{
    "status": 1000,
    "description": "Error message describing what went wrong"
}
```

### Common Error Scenarios

#### Invalid App Name

**Request**:

```bash
curl -X POST http://captain.rootdomain.com/api/v2/user/apps/appdefinition/register/ \
  -H "Content-Type: application/json" \
  -d '{"appName": "My App", "hasPersistentData": false}'
```

**Response** (400):

```json
{
    "status": 1104,
    "description": "App name must be lowercase and alphanumeric with hyphens only"
}
```

#### Unauthorized Access

**Response** (401):

```json
{
    "status": 1102,
    "description": "Not authorized"
}
```

#### Resource Not Found

**Response** (404):

```json
{
    "status": 1111,
    "description": "App not found: my-app"
}
```

#### Build Error

**Response** (500):

```json
{
    "status": 1109,
    "description": "Build failed: Docker build error at line 5"
}
```

---

## Railway-like UX Extensions

### Planned Endpoints (Based on Migration Plan)

These endpoints are planned for the Railway-like UX migration:

#### Get Project Overview

**Endpoint**: `GET /api/v2/user/project/:projectId/overview`

**Description**: Get project with all services and recent deployments

**Response**:

```json
{
  "status": 100,
  "description": "Project overview retrieved",
  "data": {
    "project": {...},
    "services": [...],
    "recentDeployments": [...]
  }
}
```

#### Manage Project Environment Variables

**Endpoint**: `GET /api/v2/user/project/:projectId/env`
**Endpoint**: `POST /api/v2/user/project/:projectId/env`
**Endpoint**: `DELETE /api/v2/user/project/:projectId/env/:key`

#### Service Management

**Endpoint**: `POST /api/v2/user/project/:projectId/services`
**Endpoint**: `PUT /api/v2/user/project/:projectId/services/:serviceName`
**Endpoint**: `DELETE /api/v2/user/project/:projectId/services/:serviceName`

#### Database Quick-Create

**Endpoint**: `POST /api/v2/user/project/:projectId/databases`

**Request**:

```json
{
    "type": "postgres",
    "name": "main-db",
    "version": "16"
}
```

#### Service Connections

**Endpoint**: `POST /api/v2/user/project/:projectId/connections`

**Request**:

```json
{
    "fromService": "backend",
    "toService": "postgres"
}
```

---

## Testing Tips

### 1. Get Auth Token from Browser

Open browser DevTools → Application → Cookies → Find `captain.rootdomain.com` → Copy auth token

### 2. Test with Postman

Import the following environment variables:

- `base_url`: `http://captain.rootdomain.com`
- `auth_token`: Your JWT token
- `namespace`: `captain`

### 3. WebSocket for Real-time Logs

```javascript
const ws = new WebSocket(
    'ws://captain.rootdomain.com/api/v2/user/apps/appData/my-api/logs/stream'
)
ws.onmessage = (event) => {
    console.log('Log:', event.data)
}
```

---

## Additional Resources

- **Source Code**: `/Users/mac/Documents/my-products/railover/src/routes/`
- **Models**: `/Users/mac/Documents/my-products/railover/src/models/`
- **Migration Plan**: `/Users/mac/Documents/my-products/railover/RAILWAY_MIGRATION_PLAN.md`

---

**Last Updated**: January 6, 2026
