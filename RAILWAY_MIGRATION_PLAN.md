# Railway-like UX Migration Plan for CapRover

**Goal**: Transform CapRover into a Railway-like development experience with unified project dashboards, seamless GitHub integration, and first-class database support.

---

## 📊 Current State Analysis

### Backend (`railover/`)
- **Tech Stack**: TypeScript, Node.js, Express 5, Dockerode
- **Storage**: configstore (JSON files)
- **Projects**: Hierarchical structure exists but underutilized
- **Apps**: Individual services, no grouping UX
- **Git**: Webhook-based deployment (push tokens)
- **Env Vars**: Per-app only
- **Architecture**: Class-based, Promise chains, dependency injection

### Frontend (`railoover-frontend/`)
- **Tech Stack**: React 18, Ant Design 5, Redux Toolkit, React Router 5
- **Build**: Create React App + CRACO
- **Current Routes**:
  - `/` → Dashboard
  - `/apps` → Apps list
  - `/apps/details/:appName` → App details
  - `/apps/oneclick` → One-click apps
  - `/monitoring` → Monitoring
  - `/settings` → Settings
  - `/cluster` → Cluster management

**Key Files**:
- `src/containers/PageRoot.tsx` - Main routing
- `src/containers/apps/Apps.tsx` - Apps list
- `src/containers/apps/AppsTable.tsx` - Apps table component
- `src/containers/apps/appDetails/AppDetails.tsx` - Individual app view
- `src/models/ProjectDefinition.ts` - Project model (minimal)

---

## 🎯 Target Railway-like Experience

### Visual Hierarchy
```
Railway.app approach:
┌─ Projects (top level)
│  ├─ Project Dashboard (unified view)
│  │  ├─ Services (Frontend, Backend, DB all visible)
│  │  ├─ Deployments (all services)
│  │  ├─ Environment Variables (project-wide + service-specific)
│  │  └─ Settings (GitHub, domains)
│  └─ Service Details (drill down)
```

### Key Features to Implement
1. ✅ **Project-Centric View** - All services in one dashboard
2. ✅ **Service Types** - Frontend | Backend | Database | Worker
3. ✅ **GitHub App Integration** - Auto-deploy on push
4. ✅ **Database Quick-Create** - Postgres, MySQL, Redis, Mongo as first-class citizens
5. ✅ **Hierarchical Env Vars** - Project-level + Service-level
6. ✅ **Service Connections** - Visual linking (DB → API → Frontend)
7. ✅ **Deployment Dashboard** - See all service deployments in one place

---

## 📅 Implementation Phases

### **Phase 1: Backend Data Model (Week 1-2)**

#### 1.1 Enhanced Project Model
**File**: `src/models/ProjectDefinition.ts`

```typescript
export interface ServiceReference {
    appName: string
    serviceType: 'frontend' | 'backend' | 'database' | 'worker' | 'cron'
    displayName: string
    githubPath?: string  // For monorepo support
    connections?: string[]  // Connected service names
    order?: number  // Display order
}

export interface GitHubIntegration {
    repo: string  // "user/repo"
    branch: string
    installationId?: string  // GitHub App installation ID
    autoDeployEnabled: boolean
}

export interface ProjectDefinition {
    id: string
    name: string
    description: string
    parentProjectId?: string
    
    // NEW:
    githubIntegration?: GitHubIntegration
    sharedEnvVars?: IAppEnvVar[]  // Project-level env vars
    services?: ServiceReference[]  // Service registry
    createdAt?: string
    updatedAt?: string
}
```

**Implementation**:
```bash
# Files to modify:
- src/models/ProjectDefinition.ts (add new fields)
- src/datastore/ProjectsDataStore.ts (handle new fields in save/get)
- src/routes/user/ProjectsRouter.ts (new endpoints)
```

#### 1.2 Service Type System
**File**: `src/models/ServiceType.ts` (NEW)

```typescript
export enum ServiceType {
    FRONTEND = 'frontend',
    BACKEND = 'backend',
    DATABASE = 'database',
    WORKER = 'worker',
    CRON = 'cron'
}

export interface ServiceTypeMetadata {
    type: ServiceType
    icon: string
    color: string
    defaultPort?: number
    isStateful: boolean
}

export const SERVICE_TYPE_METADATA: Record<ServiceType, ServiceTypeMetadata> = {
    [ServiceType.FRONTEND]: {
        type: ServiceType.FRONTEND,
        icon: '🌐',
        color: '#8b5cf6',
        defaultPort: 80,
        isStateful: false
    },
    [ServiceType.BACKEND]: {
        type: ServiceType.BACKEND,
        icon: '⚙️',
        color: '#3b82f6',
        defaultPort: 3000,
        isStateful: false
    },
    [ServiceType.DATABASE]: {
        type: ServiceType.DATABASE,
        icon: '🗄️',
        color: '#10b981',
        isStateful: true
    },
    // ...
}
```

#### 1.3 App Definition Enhancement
**File**: `src/models/AppDefinition.ts`

```typescript
export interface IAppDef extends IAppDefinitionBase {
    // ... existing fields
    
    // NEW:
    serviceType?: ServiceType  // Classify the app
    projectId?: string  // Already exists
    displayName?: string  // User-friendly name
    githubPath?: string  // For monorepo: "packages/api"
    connectedServices?: string[]  // Services this depends on
}
```

#### 1.4 Database Templates
**File**: `src/user/DatabaseTemplateManager.ts` (NEW)

```typescript
export interface DatabaseTemplate {
    type: 'postgres' | 'mysql' | 'redis' | 'mongodb'
    version: string
    imageName: string
    defaultEnvVars: IAppEnvVar[]
    defaultPort: number
    volumePath: string
}

class DatabaseTemplateManager {
    async createDatabase(
        projectId: string,
        dbType: 'postgres' | 'mysql' | 'redis' | 'mongodb',
        serviceName: string,
        version?: string
    ): Promise<IAppDef> {
        // 1. Generate random password
        // 2. Create app with template
        // 3. Mark as database service type
        // 4. Auto-connect to project
        // 5. Return connection string
    }
    
    getConnectionString(dbType: string, serviceName: string): string {
        // postgres://user:pass@service-name:5432/dbname
    }
}
```

---

### **Phase 2: Backend API Enhancement (Week 2-3)**

#### 2.1 Enhanced Project Routes
**File**: `src/routes/user/ProjectsRouter.ts`

```typescript
// NEW ENDPOINTS:

// Get project overview (project + all services + deployments)
router.get('/:projectId/overview', async (req, res) => {
    const { projectId } = req.params
    // Return: project, services[], recent deployments[]
})

// Project-level environment variables
router.get('/:projectId/env', ...)
router.post('/:projectId/env', ...)  // Add/update
router.delete('/:projectId/env/:key', ...)

// Service management within project
router.post('/:projectId/services', ...)  // Add service to project
router.put('/:projectId/services/:serviceName', ...)  // Update service metadata
router.delete('/:projectId/services/:serviceName', ...)

// Database quick-create
router.post('/:projectId/databases', async (req, res) => {
    const { type, name, version } = req.body
    // Create database service, add to project
})

// Service connections
router.post('/:projectId/connections', async (req, res) => {
    const { fromService, toService } = req.body
    // Link services, auto-inject env vars
})

// GitHub integration
router.post('/:projectId/github/connect', ...)
router.delete('/:projectId/github/disconnect', ...)
router.get('/:projectId/deployments', ...)  // All service deployments
```

#### 2.2 GitHub Integration Routes
**File**: `src/routes/user/github/GitHubRouter.ts` (NEW)

```typescript
router.get('/installations')  // List user's GitHub App installations
router.get('/installations/:id/repos')  // List repos
router.post('/connect')  // Connect repo to project
router.post('/webhook')  // GitHub webhook receiver

// Webhook handler
async function handleGitHubWebhook(req, res) {
    const event = req.headers['x-github-event']
    const payload = req.body
    
    if (event === 'push') {
        // 1. Find project by repo
        // 2. Determine affected services (monorepo detection)
        // 3. Trigger builds
        // 4. Update GitHub deployment status
    }
}
```

#### 2.3 Service Connection Manager
**File**: `src/user/ServiceConnectionManager.ts` (NEW)

```typescript
class ServiceConnectionManager {
    async connectServices(
        projectId: string,
        fromService: string,
        toService: string
    ) {
        // 1. Get service types
        // 2. Generate connection env vars
        // 3. Inject into fromService
        
        // Example: Backend connects to Postgres
        // Auto-adds to backend:
        // DATABASE_URL=postgresql://...
        // DB_HOST=postgres-service
        // DB_PORT=5432
    }
    
    async disconnectServices(projectId: string, fromService: string, toService: string) {
        // Remove auto-injected env vars
    }
    
    getServiceDependencies(projectId: string): ServiceGraph {
        // Return dependency graph for visualization
    }
}
```

#### 2.4 Environment Variable Hierarchy
**File**: `src/user/EnvVarManager.ts` (NEW)

```typescript
class EnvVarManager {
    // Get merged env vars (project + service)
    async getMergedEnvVars(appName: string): Promise<IAppEnvVar[]> {
        const app = await dataStore.getAppDefinition(appName)
        const project = await dataStore.getProject(app.projectId)
        
        const projectVars = project.sharedEnvVars || []
        const serviceVars = app.envVars || []
        
        // Service vars override project vars
        return this.mergeEnvVars(projectVars, serviceVars)
    }
    
    // Set project-level env var
    async setProjectEnvVar(projectId: string, key: string, value: string) {
        // Update all services in project
    }
}
```

---

### **Phase 3: GitHub App Setup (Week 3)**

#### 3.1 GitHub App Configuration
**Steps**:
1. Go to GitHub → Settings → Developer settings → GitHub Apps
2. Create new GitHub App "CapRover Deploy"
3. **Permissions**:
   - Repository contents: Read
   - Deployments: Read & Write
   - Webhooks: Read & Write
   - Commit statuses: Read & Write
4. **Events** (subscribe):
   - Push
   - Pull request
5. **Webhook URL**: `https://your-caprover.com/api/v2/github/webhook`
6. Generate private key, store securely

#### 3.2 Backend Implementation
**File**: `src/user/GitHubAppManager.ts` (NEW)

```typescript
import { App } from 'octokit'

class GitHubAppManager {
    private app: App
    
    constructor(appId: string, privateKey: string) {
        this.app = new App({
            appId,
            privateKey
        })
    }
    
    async getUserInstallations(userToken: string) {
        // Get installations for user
    }
    
    async getRepos(installationId: string) {
        // Get accessible repos
    }
    
    async createDeploymentStatus(repo: string, deploymentId: string, state: string) {
        // Update GitHub deployment status
    }
}
```

#### 3.3 Auto-deployment Flow
```
1. Push to GitHub
   ↓
2. GitHub webhook → CapRover
   ↓
3. Identify project & affected services
   ↓
4. Trigger builds (parallel if possible)
   ↓
5. Update GitHub deployment status
   ↓
6. Frontend shows live build logs
```

---

### **Phase 4: Frontend Rebuild (Week 4-6)**

#### 4.1 New Route Structure
**File**: `src/containers/PageRoot.tsx`

```typescript
// ADD NEW ROUTES:
<Route path="/projects" exact component={ProjectsList} />
<Route path="/projects/:projectId" exact component={ProjectDashboard} />
<Route path="/projects/:projectId/services/:serviceName" component={ServiceDetails} />

// KEEP EXISTING:
<Route path="/apps" component={Apps} />  // Legacy support
```

#### 4.2 Project Dashboard Component
**File**: `src/containers/projects/ProjectDashboard.tsx` (NEW)

```tsx
import { Card, Col, Row, Tabs } from 'antd'
import React from 'react'
import { useParams } from 'react-router'
import ServiceCard from './ServiceCard'
import ProjectEnvironment from './ProjectEnvironment'
import DeploymentHistory from './DeploymentHistory'

const ProjectDashboard: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>()
    const [project, setProject] = useState<ProjectDefinition>()
    const [services, setServices] = useState<IAppDef[]>([])
    
    useEffect(() => {
        // Fetch project overview
        ApiManager.get(`/user/project/${projectId}/overview`)
            .then(res => {
                setProject(res.data.project)
                setServices(res.data.services)
            })
    }, [projectId])
    
    return (
        <div className="project-dashboard">
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <h1>{project?.name}</h1>
                    <p>{project?.description}</p>
                </Col>
            </Row>
            
            <Tabs defaultActiveKey="overview">
                <Tabs.TabPane tab="Overview" key="overview">
                    <ServicesOverview services={services} projectId={projectId} />
                </Tabs.TabPane>
                
                <Tabs.TabPane tab="Environment" key="environment">
                    <ProjectEnvironment projectId={projectId} />
                </Tabs.TabPane>
                
                <Tabs.TabPane tab="Deployments" key="deployments">
                    <DeploymentHistory projectId={projectId} />
                </Tabs.TabPane>
                
                <Tabs.TabPane tab="Settings" key="settings">
                    <ProjectSettings project={project} />
                </Tabs.TabPane>
            </Tabs>
        </div>
    )
}
```

#### 4.3 Services Overview
**File**: `src/containers/projects/ServicesOverview.tsx` (NEW)

```tsx
const ServicesOverview: React.FC<{ services: IAppDef[], projectId: string }> = ({ services, projectId }) => {
    const [showAddService, setShowAddService] = useState(false)
    
    // Group by service type
    const frontend = services.filter(s => s.serviceType === 'frontend')
    const backend = services.filter(s => s.serviceType === 'backend')
    const databases = services.filter(s => s.serviceType === 'database')
    const workers = services.filter(s => s.serviceType === 'worker')
    
    return (
        <div>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Button type="primary" onClick={() => setShowAddService(true)}>
                        Add Service
                    </Button>
                </Col>
            </Row>
            
            {frontend.length > 0 && (
                <ServiceTypeSection title="Frontend" services={frontend} color="#8b5cf6" />
            )}
            
            {backend.length > 0 && (
                <ServiceTypeSection title="Backend" services={backend} color="#3b82f6" />
            )}
            
            {databases.length > 0 && (
                <ServiceTypeSection title="Databases" services={databases} color="#10b981" />
            )}
            
            {workers.length > 0 && (
                <ServiceTypeSection title="Workers" services={workers} color="#f59e0b" />
            )}
            
            <AddServiceModal 
                visible={showAddService}
                onCancel={() => setShowAddService(false)}
                projectId={projectId}
            />
        </div>
    )
}
```

#### 4.4 Service Card Component
**File**: `src/containers/projects/ServiceCard.tsx` (NEW)

```tsx
interface ServiceCardProps {
    service: IAppDef
    color: string
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, color }) => {
    const status = service.isAppBuilding ? 'deploying' : 'running'
    const statusColor = status === 'running' ? '#10b981' : '#f59e0b'
    
    return (
        <Card 
            className="service-card"
            hoverable
            onClick={() => navigate(`/projects/${service.projectId}/services/${service.appName}`)}
            style={{ borderLeft: `4px solid ${color}` }}
        >
            <Row justify="space-between" align="middle">
                <Col>
                    <h3>{service.displayName || service.appName}</h3>
                    <div style={{ fontSize: 12, color: '#888' }}>
                        {service.serviceType}
                    </div>
                </Col>
                <Col>
                    <Badge color={statusColor} text={status} />
                </Col>
            </Row>
            
            {service.versions?.length > 0 && (
                <div style={{ marginTop: 12, fontSize: 12 }}>
                    Last deployed: {moment(service.versions[0].timeStamp).fromNow()}
                </div>
            )}
        </Card>
    )
}
```

#### 4.5 Add Service Modal
**File**: `src/containers/projects/AddServiceModal.tsx` (NEW)

```tsx
const AddServiceModal: React.FC = ({ visible, onCancel, projectId }) => {
    const [step, setStep] = useState(1)
    const [serviceType, setServiceType] = useState<ServiceType>()
    const [databaseType, setDatabaseType] = useState<'postgres' | 'mysql' | 'redis' | 'mongodb'>()
    
    return (
        <Modal visible={visible} onCancel={onCancel} width={600}>
            {step === 1 && (
                <div>
                    <h2>Choose Service Type</h2>
                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Card 
                                hoverable 
                                onClick={() => { setServiceType('frontend'); setStep(2) }}
                                style={{ borderLeft: '4px solid #8b5cf6' }}
                            >
                                <h3>🌐 Frontend</h3>
                                <p>React, Vue, Next.js, Static sites</p>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card 
                                hoverable 
                                onClick={() => { setServiceType('backend'); setStep(2) }}
                                style={{ borderLeft: '4px solid #3b82f6' }}
                            >
                                <h3>⚙️ Backend</h3>
                                <p>Node.js, Python, Go, Ruby</p>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card 
                                hoverable 
                                onClick={() => { setServiceType('database'); setStep(2) }}
                                style={{ borderLeft: '4px solid #10b981' }}
                            >
                                <h3>🗄️ Database</h3>
                                <p>PostgreSQL, MySQL, Redis, MongoDB</p>
                            </Card>
                        </Col>
                        <Col span={12}>
                            <Card 
                                hoverable 
                                onClick={() => { setServiceType('worker'); setStep(2) }}
                                style={{ borderLeft: '4px solid #f59e0b' }}
                            >
                                <h3>⚡ Worker</h3>
                                <p>Background jobs, Cron tasks</p>
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}
            
            {step === 2 && serviceType === 'database' && (
                <DatabaseQuickCreate projectId={projectId} onSuccess={onCancel} />
            )}
            
            {step === 2 && serviceType !== 'database' && (
                <ServiceConfiguration 
                    projectId={projectId}
                    serviceType={serviceType}
                    onSuccess={onCancel}
                />
            )}
        </Modal>
    )
}
```

#### 4.6 Environment Variables Manager
**File**: `src/containers/projects/ProjectEnvironment.tsx` (NEW)

```tsx
const ProjectEnvironment: React.FC<{ projectId: string }> = ({ projectId }) => {
    const [projectVars, setProjectVars] = useState<IAppEnvVar[]>([])
    const [serviceVars, setServiceVars] = useState<Record<string, IAppEnvVar[]>>({})
    
    return (
        <div>
            <Card title="Project-Level Variables" extra={<Button>Add Variable</Button>}>
                <p>These variables are available to all services in this project</p>
                <EnvVarTable 
                    envVars={projectVars}
                    onUpdate={(key, value) => updateProjectVar(projectId, key, value)}
                    onDelete={(key) => deleteProjectVar(projectId, key)}
                />
            </Card>
            
            <Card title="Service-Level Variables" style={{ marginTop: 16 }}>
                <Collapse>
                    {Object.entries(serviceVars).map(([serviceName, vars]) => (
                        <Collapse.Panel key={serviceName} header={serviceName}>
                            <EnvVarTable 
                                envVars={vars}
                                inheritedVars={projectVars}
                            />
                        </Collapse.Panel>
                    ))}
                </Collapse>
            </Card>
        </div>
    )
}
```

---

### **Phase 5: UX Polish (Week 6-7)**

#### 5.1 Railway-like Styling
**File**: `src/styles/project-dashboard.css` (NEW)

```css
/* Railway-inspired dark theme */
.project-dashboard {
  background: #0a0a0a;
  min-height: 100vh;
  padding: 24px;
}

.service-card {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  transition: all 0.2s;
}

.service-card:hover {
  border-color: #4f5bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 91, 255, 0.2);
}

.service-type-section {
  margin-bottom: 32px;
}

.service-type-header {
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
  opacity: 0.7;
}

/* Build logs styling */
.build-logs {
  background: #0a0a0a;
  color: #e5e5e5;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  padding: 16px;
  border-radius: 4px;
  overflow-x: auto;
}

.build-log-line {
  line-height: 1.6;
  white-space: pre-wrap;
}

.build-log-line.error {
  color: #ef4444;
}

.build-log-line.warning {
  color: #f59e0b;
}

.build-log-line.success {
  color: #10b981;
}
```

#### 5.2 Real-time Deployment Status
**File**: `src/containers/projects/DeploymentStatus.tsx` (NEW)

```tsx
const DeploymentStatus: React.FC<{ deploymentId: string }> = ({ deploymentId }) => {
    const [logs, setLogs] = useState<string[]>([])
    const [status, setStatus] = useState<'building' | 'deploying' | 'success' | 'failed'>('building')
    
    useEffect(() => {
        // WebSocket connection for live logs
        const ws = new WebSocket(`ws://...`)
        
        ws.onmessage = (event) => {
            const log = event.data
            setLogs(prev => [...prev, log])
        }
        
        return () => ws.close()
    }, [deploymentId])
    
    return (
        <div>
            <Progress 
                percent={getProgress(status)}
                status={status === 'failed' ? 'exception' : 'active'}
            />
            
            <div className="build-logs">
                {logs.map((log, i) => (
                    <div key={i} className={`build-log-line ${getLogType(log)}`}>
                        {log}
                    </div>
                ))}
            </div>
        </div>
    )
}
```

#### 5.3 Service Connection Visualization
**File**: `src/containers/projects/ServiceConnections.tsx` (NEW)

```tsx
// Use React Flow or custom SVG for visual graph
const ServiceConnections: React.FC<{ services: IAppDef[] }> = ({ services }) => {
    // Build dependency graph
    const nodes = services.map(s => ({
        id: s.appName,
        type: s.serviceType,
        label: s.displayName || s.appName
    }))
    
    const edges = services.flatMap(s => 
        (s.connectedServices || []).map(target => ({
            source: s.appName,
            target
        }))
    )
    
    return (
        <div className="service-connections">
            {/* Visual graph: Frontend → Backend → Database */}
            <ReactFlow nodes={nodes} edges={edges} />
        </div>
    )
}
```

---

## 🚀 Quick Start Implementation Guide

### Step 1: Backend Foundation (Day 1-3)
```bash
cd /Users/mac/Documents/my-products/railover

# 1. Create new models
touch src/models/ServiceType.ts
# Add ServiceType enum and metadata

# 2. Update ProjectDefinition
# Edit src/models/ProjectDefinition.ts
# Add: githubIntegration, sharedEnvVars, services fields

# 3. Update AppDefinition
# Edit src/models/AppDefinition.ts
# Add: serviceType, displayName, githubPath, connectedServices

# 4. Update datastore
# Edit src/datastore/ProjectsDataStore.ts
# Handle new fields in save/get methods

# 5. Build and test
npm run build
npm test
```

### Step 2: API Routes (Day 4-7)
```bash
# 1. Enhance ProjectsRouter
# Edit src/routes/user/ProjectsRouter.ts
# Add new endpoints: overview, env, services, databases, connections

# 2. Create managers
touch src/user/DatabaseTemplateManager.ts
touch src/user/EnvVarManager.ts
touch src/user/ServiceConnectionManager.ts

# 3. Test endpoints
npm run build
# Start server and test with curl/Postman
```

### Step 3: Frontend Setup (Day 8-10)
```bash
cd /Users/mac/Documents/my-products/railoover-frontend

# 1. Create new directories
mkdir -p src/containers/projects
mkdir -p src/components/projects

# 2. Create new components
touch src/containers/projects/ProjectDashboard.tsx
touch src/containers/projects/ServicesOverview.tsx
touch src/containers/projects/ServiceCard.tsx
touch src/containers/projects/AddServiceModal.tsx
touch src/containers/projects/ProjectEnvironment.tsx

# 3. Update routing
# Edit src/containers/PageRoot.tsx
# Add new routes for /projects/:id

# 4. Test
yarn start
```

---

## 📋 Checklist

### Backend
- [ ] Enhanced ProjectDefinition model
- [ ] ServiceType enum and metadata
- [ ] Updated AppDefinition with serviceType
- [ ] DatabaseTemplateManager
- [ ] EnvVarManager (hierarchical env vars)
- [ ] ServiceConnectionManager
- [ ] Enhanced ProjectsRouter endpoints
- [ ] GitHub webhook handler
- [ ] Tests for new functionality

### Frontend
- [ ] ProjectDashboard component
- [ ] ServicesOverview component
- [ ] ServiceCard component
- [ ] AddServiceModal with wizard
- [ ] ProjectEnvironment manager
- [ ] DeploymentHistory view
- [ ] Service connection visualization
- [ ] Railway-like styling
- [ ] Real-time deployment logs (WebSocket)

### GitHub Integration
- [ ] Create GitHub App
- [ ] OAuth flow for installation
- [ ] Webhook receiver
- [ ] Auto-deployment on push
- [ ] Monorepo detection
- [ ] Deployment status updates

---

## 🎨 Design References

### Railway.app Key Features to Emulate
1. **Dark mode by default** - Clean, modern
2. **Service cards** - Visual, color-coded
3. **Live deployment logs** - Streaming, syntax-highlighted
4. **One-click database creation** - No config needed
5. **Environment variable management** - Clear hierarchy
6. **GitHub integration** - Seamless, auto-deploy
7. **Project dashboard** - All services in one view

### Color Scheme (Railway-inspired)
```css
--primary: #4f5bff;
--frontend: #8b5cf6;
--backend: #3b82f6;
--database: #10b981;
--worker: #f59e0b;
--error: #ef4444;
--success: #10b981;
--warning: #f59e0b;
```

---

## 🔧 Migration for Existing Users

### Backward Compatibility Strategy
1. **Keep old routes** - `/apps` still works
2. **Auto-detect service types** - Apps with DB names → database type
3. **Migration script** - Convert existing apps to projects
4. **Gradual rollout** - Feature flag for new UI

### Migration Script
```typescript
// scripts/migrate-to-projects.ts
async function migrateAppsToProjects() {
    const apps = await dataStore.getAppDefinitions()
    
    // Group by project (if exists) or create default project
    const projectGroups = groupAppsByProject(apps)
    
    for (const [projectId, apps] of projectGroups) {
        // Auto-detect service types
        apps.forEach(app => {
            app.serviceType = detectServiceType(app)
        })
        
        // Update project with services
        await updateProjectServices(projectId, apps)
    }
}

function detectServiceType(app: IAppDef): ServiceType {
    const name = app.appName?.toLowerCase() || ''
    
    if (name.includes('postgres') || name.includes('mysql') || name.includes('mongo') || name.includes('redis')) {
        return ServiceType.DATABASE
    }
    
    if (name.includes('frontend') || name.includes('web') || name.includes('ui')) {
        return ServiceType.FRONTEND
    }
    
    if (name.includes('worker') || name.includes('queue') || name.includes('job')) {
        return ServiceType.WORKER
    }
    
    return ServiceType.BACKEND  // Default
}
```

---

## 📊 Timeline Summary

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Backend data models | ServiceType, enhanced models |
| 2 | Backend API | New endpoints, managers |
| 3 | GitHub integration | App setup, webhook handler |
| 4-5 | Frontend rebuild | Project dashboard, service cards |
| 6 | Environment & connections | Env var manager, service linking |
| 7 | Polish & testing | Styling, real-time logs, testing |

**Total**: ~7 weeks to MVP Railway-like experience

---

## 🎯 Priority Order (If Time-Constrained)

### Must Have (MVP)
1. ✅ Project dashboard view
2. ✅ Service type classification (frontend/backend/database)
3. ✅ Database quick-create
4. ✅ Project-level environment variables

### Should Have
5. ✅ GitHub auto-deployment
6. ✅ Service connection visualization
7. ✅ Real-time deployment logs

### Nice to Have
8. Project templates (MERN, Next.js, etc.)
9. Monorepo support
10. Advanced service metrics

---

## 🚦 Next Steps

**What would you like to start with?**

1. **Backend foundation** - Enhance data models and API
2. **Frontend prototype** - Build project dashboard first
3. **GitHub integration** - Set up auto-deployment
4. **Database quick-create** - One-click Postgres/MySQL

Let me know and I'll provide detailed implementation steps!
