import { IAppEnvVar } from './AppDefinition'
import { ServiceType } from './ServiceType'
import { UserCollaborator } from './UserDefinition'

export interface GitHubIntegration {
    repo: string
    branch: string
    installationId?: string
    autoDeployEnabled: boolean
}

export interface ServiceReference {
    appName: string
    serviceType: ServiceType
    displayName: string
    githubPath?: string
    connections?: string[]
    order?: number
}

export interface ProjectDefinition {
    id: string
    name: string
    description: string
    parentProjectId?: string
    githubIntegration?: GitHubIntegration
    sharedEnvVars?: IAppEnvVar[]
    services?: ServiceReference[]
    createdAt?: string
    updatedAt?: string
    ownerId?: string
    collaborators?: UserCollaborator[]
}
