export interface UserDefinition {
    id: string
    username: string
    email: string
    passwordHash: string
    role: UserRole
    permissions: UserPermissions
    createdAt: string
    lastLogin?: string
}

export enum UserRole {
    SUPER_ADMIN = 'super_admin', // VDS owner
    ADMIN = 'admin', // Team leads
    DEVELOPER = 'developer', // Team devs
    VIEWER = 'viewer', // Read-only access
}

export interface UserPermissions {
    projects: string[] // Project IDs they can access
    projectActions: {
        canCreate: boolean
        canDelete: boolean
        canDeploy: boolean
    }
    system: {
        canManageUsers: boolean
        canManageSettings: boolean
        canViewLogs: boolean
        canManageDatabases: boolean
    }
}

export interface UserCollaborator {
    userId: string
    role: 'admin' | 'developer' | 'viewer'
    addedAt: string
    addedBy: string
}
