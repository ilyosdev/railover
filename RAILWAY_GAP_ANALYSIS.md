# Railway UX Gap Analysis - What's Still Needed

**Date**: January 7, 2026  
**Status**: Implementation In Progress - Phase 1 Complete

---

## Executive Summary

The CapRover → Railover transformation is approximately **65% complete**. The backend foundation is solid with all core Railway-like APIs implemented. The frontend has a working project dashboard with the visual canvas. However, several critical features are missing to achieve true Railway parity.

---

## Current Implementation Status

### Backend (85% Complete)

| Feature                                  | Status   | Notes                                                        |
| ---------------------------------------- | -------- | ------------------------------------------------------------ |
| Project model with services              | Done     | `ProjectDefinition.ts` enhanced                              |
| Service type classification              | Done     | `ServiceType.ts` (frontend, backend, database, worker, cron) |
| Database templates                       | Done     | Postgres, MySQL, Redis, MongoDB                              |
| One-click database creation              | Done     | `DatabaseTemplateManager.ts`                                 |
| Hierarchical env vars                    | Done     | `EnvVarManager.ts` (project + service level)                 |
| Service connections                      | Done     | `ServiceConnectionManager.ts` with auto-inject               |
| Project overview API                     | Done     | `GET /user/projects/:projectId/overview`                     |
| Deployment history API                   | Done     | `GET /user/projects/:projectId/deployments`                  |
| GitHub webhook scaffold                  | **Done** | Auto-deploy on push implemented                              |
| GitHub App OAuth                         | Partial  | Manual repo entry, OAuth not implemented                     |
| Reference variables (`${{service.VAR}}`) | **Done** | Backend resolver + Frontend autocomplete                     |
| Real-time deployment logs WS             | Not Done | HTTP polling only                                            |

### Frontend (55% Complete)

| Feature                   | Status   | Notes                                     |
| ------------------------- | -------- | ----------------------------------------- |
| Project Dashboard         | Done     | `/projects/:projectId` route works        |
| Services Overview         | Done     | Card-based view with type grouping        |
| Visual Canvas             | Done     | ReactFlow integration                     |
| Service Detail Drawers    | Done     | Database, Worker, Web service drawers     |
| Database Quick Create     | Done     | UI for one-click DB creation              |
| Project Env Vars UI       | Done     | `ProjectEnvironment.tsx`                  |
| Deployment History        | Done     | Timeline view                             |
| Add Service Modal         | Done     | Multi-step wizard                         |
| Service Configuration     | Done     | Form for service settings                 |
| Service Connections       | Partial  | Visualization exists, color-coded by type |
| Real-time Logs Viewer     | Not Done | No WebSocket streaming                    |
| Command Palette           | Done     | `CommandPalette.tsx` exists               |
| Reference Variable Editor | **Done** | Autocomplete with `${{}}` syntax          |
| Dark Mode Theme           | Partial  | CSS exists, needs polish                  |
| Animations & Transitions  | Not Done | Basic transitions only                    |
| Project Settings Page     | **Done** | GitHub connection, delete project         |
| Skeleton Loaders          | **Done** | ServiceCardSkeleton component             |
| Canvas Add Service Button | **Done** | Button in canvas panel                    |

---

## Critical Missing Features (Railway Parity)

### 1. Reference Variable System (HIGH PRIORITY)

Railway's killer feature: `${{Postgres.DATABASE_URL}}`

**What's needed:**

**Backend:**

```typescript
// src/user/ReferenceVariableResolver.ts
class ReferenceVariableResolver {
    // Parse ${{serviceName.VAR_NAME}} syntax
    resolveVariables(
        serviceEnvVars: IAppEnvVar[],
        allProjectServices: IAppDef[]
    ): IAppEnvVar[]

    // Get available references for autocomplete
    getAvailableReferences(projectId: string): Reference[]
}
```

**Frontend:**

- Variable editor with `${{` autocomplete
- Visual indicator when variable is a reference
- Resolution preview

**Effort**: 2-3 days

---

### 2. Real-Time Deployment Logs (HIGH PRIORITY)

Railway shows live streaming logs during build/deploy.

**Current state**: HTTP polling for logs

**What's needed:**

**Backend:**

```typescript
// src/routes/user/apps/websocket/LogStreamRouter.ts
// WebSocket endpoint for live logs
ws.on('subscribe', (appName) => {
    // Stream build logs in real-time
    // Stream runtime logs
})
```

**Frontend:**

```tsx
// WebSocket connection in DeploymentStatus.tsx
const ws = new WebSocket(`ws://.../logs/${appName}`)
ws.onmessage = (log) => {
    setLogs((prev) => [...prev, log.data])
}
```

**Effort**: 2-3 days

---

### 3. GitHub App OAuth Flow (MEDIUM PRIORITY)

Railway: Connect GitHub once, select repo from list.  
Current: Manual repo URL entry.

**What's needed:**

**Backend:**

```typescript
// src/user/GitHubAppManager.ts
class GitHubAppManager {
    // OAuth callback handler
    handleOAuthCallback(code: string): Promise<UserInstallation>

    // List user's repos
    getAccessibleRepos(installationId: string): Promise<Repository[]>

    // Trigger build on push
    handlePushWebhook(payload: PushPayload): Promise<void>
}
```

**Configuration:**

1. Create GitHub App in settings
2. Configure webhook URL
3. Store App ID, Private Key, Webhook Secret

**Frontend:**

- "Connect GitHub" button
- Repo selector dropdown
- Branch selector

**Effort**: 3-4 days

---

### 4. Auto-Deploy on Push (MEDIUM PRIORITY)

**Current state**: Webhook endpoint logs event but doesn't trigger build.

**What's needed:**

```typescript
// In GitHubRouter.ts webhook handler
if (event === 'push') {
    const repo = payload.repository.full_name
    const branch = payload.ref.replace('refs/heads/', '')

    // 1. Find project by repo
    const project = await findProjectByRepo(repo)

    // 2. Find affected services
    const services = await getProjectServices(project.id)

    // 3. Trigger builds
    for (const service of services) {
        if (service.githubIntegration?.branch === branch) {
            await triggerBuild(service.appName)
        }
    }

    // 4. Update GitHub deployment status
    await createDeploymentStatus(repo, commitSha, 'pending')
}
```

**Effort**: 2 days

---

### 5. Service Connection UI (LOW PRIORITY)

**Current state**: Visual connections inferred from env vars.

**What's needed:**

- Drag-to-connect on canvas
- Connection wizard: "Connect Backend to Database"
- Preview injected env vars before confirming

**Effort**: 2 days

---

### 6. Project Settings Page (LOW PRIORITY)

**Current state**: "Coming soon" placeholder

**What's needed:**

```tsx
// ProjectSettings.tsx
- GitHub integration settings
- Custom domains for project
- Danger zone (delete project)
- Team access (if multi-user)
```

**Effort**: 1-2 days

---

### 7. Monorepo Support (LOW PRIORITY)

Railway auto-detects services in monorepo.

**What's needed:**

```typescript
interface ServiceReference {
    appName: string
    githubPath?: string // "packages/api" for monorepo
}

// On push webhook, determine which services changed
function getAffectedServices(commits: Commit[], services: ServiceReference[]) {
    return services.filter((s) =>
        commits.some((c) =>
            c.changedFiles.some((f) => f.startsWith(s.githubPath))
        )
    )
}
```

**Effort**: 2 days

---

### 8. Build Auto-Detection (NICE TO HAVE)

Railway auto-detects language and sets build commands.

**What's needed:**

```typescript
// src/user/BuildDetector.ts
class BuildDetector {
    detectFromRepo(repoFiles: string[]): BuildConfig {
        if (hasFile('package.json')) return detectNodeProject()
        if (hasFile('requirements.txt')) return detectPythonProject()
        if (hasFile('go.mod')) return detectGoProject()
        // ...
    }
}
```

Use Nixpacks or similar for detection.

**Effort**: 3-4 days

---

### 9. Metrics Dashboard (NICE TO HAVE)

Railway shows CPU, Memory, Network charts.

**What's needed:**

- Docker stats collection
- Time-series storage (or use existing NetData integration)
- Charts in service detail drawer

**Effort**: 4-5 days

---

## UX Polish Needed

### Visual Improvements

1. **Smooth Animations**

    - Service card hover effects
    - Modal transitions
    - Canvas node animations
    - Toast notifications

2. **Dark Theme Refinement**

    - Consistent color palette
    - Better contrast ratios
    - Proper focus states

3. **Loading States**
    - Skeleton loaders
    - Progress indicators
    - Optimistic updates

### Interaction Improvements

1. **Keyboard Navigation**

    - Command palette improvements (Cmd+K)
    - Tab navigation through services
    - Keyboard shortcuts for common actions

2. **Mobile Responsiveness**
    - Canvas touch gestures
    - Responsive drawer widths
    - Mobile-friendly forms

---

## Implementation Priority Order

### Phase 1: Core Experience (Week 1-2)

1. Reference Variable System
2. Real-Time Deployment Logs
3. Dark Theme Polish

### Phase 2: GitHub Integration (Week 2-3)

4. GitHub App OAuth
5. Auto-Deploy on Push
6. Monorepo Support (basic)

### Phase 3: Polish (Week 3-4)

7. Animations & Transitions
8. Service Connection UI
9. Project Settings Page

### Phase 4: Advanced (Optional)

10. Build Auto-Detection
11. Metrics Dashboard
12. Advanced Monorepo Support

---

## Quick Wins (Can Do Today)

1. **Fix "Settings" tab** - Currently shows "coming soon"

    - Add basic project settings form
    - GitHub repo connection (manual entry still)
    - Delete project button

2. **Improve Canvas experience**

    - Add "Add Service" button to canvas
    - Double-click to open service drawer
    - Right-click context menu

3. **Better loading states**

    - Add skeleton loaders to service cards
    - Show "Building..." animation on cards during deploy

4. **Connection line styles**
    - Color code by connection type (DB=green, API=blue)
    - Animate data flow direction

---

## Technical Debt to Address

1. **Type Safety**

    - Many `any` types in backend code
    - Service connection manager uses loose typing

2. **Error Handling**

    - Better error messages for user-facing errors
    - Retry logic for transient failures

3. **Testing**

    - Unit tests for new managers
    - Integration tests for API endpoints
    - E2E tests for frontend flows

4. **Documentation**
    - API documentation needs updating
    - Component storybook
    - Architecture decision records

---

## Conclusion

The Railover transformation has a solid foundation. The **critical path** to Railway parity is:

1. **Reference Variables** - The biggest UX differentiator
2. **Real-Time Logs** - Essential for deployment experience
3. **GitHub OAuth** - Removes friction from setup

With these three features, the platform would feel 90% like Railway. The remaining 10% is polish, which can be done incrementally.

**Estimated Time to Railway Parity**: 3-4 weeks focused development

---

## Appendix: File Locations for Implementation

### Backend Files to Create

```
src/user/ReferenceVariableResolver.ts
src/user/GitHubAppManager.ts
src/user/BuildDetector.ts
src/routes/user/apps/websocket/LogStreamRouter.ts
```

### Backend Files to Modify

```
src/routes/user/github/GitHubRouter.ts (auto-deploy)
src/user/EnvVarManager.ts (reference resolution)
src/user/ServiceManager.ts (build trigger)
```

### Frontend Files to Create

```
src/containers/projects/ReferenceVariableEditor.tsx
src/containers/projects/LiveLogViewer.tsx
src/containers/projects/GitHubConnector.tsx
src/containers/projects/ProjectSettings.tsx
```

### Frontend Files to Modify

```
src/containers/projects/EnvVarTable.tsx (reference autocomplete)
src/containers/projects/DeploymentStatus.tsx (WebSocket)
src/containers/projects/ProjectDashboard.tsx (settings tab)
src/containers/projects/ServiceConnections.tsx (creation UI)
```
