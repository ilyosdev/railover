import ApiStatusCodes from '../api/ApiStatusCodes'
import DataStore from '../datastore/DataStore'
import { IAppEnvVar } from '../models/AppDefinition'
import Logger from '../utils/Logger'

/**
 * EnvVarManager handles hierarchical environment variables
 * Project-level vars are inherited by all services
 * Service-level vars override project vars
 */
class EnvVarManager {
    constructor(private dataStore: DataStore) {}

    /**
     * Get merged environment variables for an app (project + service)
     * Service vars override project vars with same key
     */
    getMergedEnvVars(appName: string) {
        const self = this
        const dataStore = this.dataStore
        let app: any
        let projectVars: IAppEnvVar[] = []

        return Promise.resolve()
            .then(function () {
                return dataStore.getAppsDataStore().getAppDefinition(appName)
            })
            .then(function (appDef) {
                app = appDef
                if (app.projectId) {
                    return dataStore
                        .getProjectsDataStore()
                        .getProject(app.projectId)
                }
            })
            .then(function (project) {
                if (project && project.sharedEnvVars) {
                    projectVars = project.sharedEnvVars
                }

                const serviceVars = app.envVars || []

                // Merge: service vars override project vars
                return self.mergeEnvVars(projectVars, serviceVars)
            })
    }

    /**
     * Merge environment variables with override logic
     * Service vars take precedence over project vars
     */
    private mergeEnvVars(
        projectVars: IAppEnvVar[],
        serviceVars: IAppEnvVar[]
    ): IAppEnvVar[] {
        const merged = new Map<string, string>()

        // Add project vars first
        projectVars.forEach((envVar) => {
            merged.set(envVar.key, envVar.value)
        })

        // Service vars override
        serviceVars.forEach((envVar) => {
            merged.set(envVar.key, envVar.value)
        })

        return Array.from(merged.entries()).map(([key, value]) => ({
            key,
            value,
        }))
    }

    /**
     * Get project-level environment variables
     */
    getProjectEnvVars(projectId: string) {
        const dataStore = this.dataStore

        return Promise.resolve()
            .then(function () {
                return dataStore.getProjectsDataStore().getProject(projectId)
            })
            .then(function (project) {
                return project.sharedEnvVars || []
            })
    }

    /**
     * Set project-level environment variable
     * This will be inherited by all services in the project
     */
    setProjectEnvVar(projectId: string, key: string, value: string) {
        const dataStore = this.dataStore
        let project: any

        return Promise.resolve()
            .then(function () {
                if (!key || !key.trim()) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'Environment variable key is required'
                    )
                }

                return dataStore.getProjectsDataStore().getProject(projectId)
            })
            .then(function (proj) {
                project = proj

                const sharedEnvVars = project.sharedEnvVars || []
                const existingIndex = sharedEnvVars.findIndex(
                    (v: IAppEnvVar) => v.key === key
                )

                if (existingIndex >= 0) {
                    // Update existing
                    sharedEnvVars[existingIndex].value = value
                } else {
                    // Add new
                    sharedEnvVars.push({ key, value })
                }

                project.sharedEnvVars = sharedEnvVars
                project.updatedAt = new Date().toISOString()

                return dataStore
                    .getProjectsDataStore()
                    .saveProject(projectId, project)
            })
            .then(function () {
                Logger.d(
                    `Project env var set: ${projectId} - ${key}=${value.substring(0, 10)}...`
                )
                return { key, value }
            })
    }

    /**
     * Delete project-level environment variable
     */
    deleteProjectEnvVar(projectId: string, key: string) {
        const dataStore = this.dataStore
        let project: any

        return Promise.resolve()
            .then(function () {
                return dataStore.getProjectsDataStore().getProject(projectId)
            })
            .then(function (proj) {
                project = proj

                const sharedEnvVars = project.sharedEnvVars || []
                project.sharedEnvVars = sharedEnvVars.filter(
                    (v: IAppEnvVar) => v.key !== key
                )
                project.updatedAt = new Date().toISOString()

                return dataStore
                    .getProjectsDataStore()
                    .saveProject(projectId, project)
            })
            .then(function () {
                Logger.d(`Project env var deleted: ${projectId} - ${key}`)
            })
    }

    /**
     * Add or update service-level environment variable
     */
    setServiceEnvVar(appName: string, key: string, value: string) {
        const dataStore = this.dataStore

        return Promise.resolve()
            .then(function () {
                if (!key || !key.trim()) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'Environment variable key is required'
                    )
                }

                return dataStore.getAppsDataStore().getAppDefinition(appName)
            })
            .then(function (app) {
                const envVars = app.envVars || []
                const existingIndex = envVars.findIndex((v) => v.key === key)

                if (existingIndex >= 0) {
                    envVars[existingIndex].value = value
                } else {
                    envVars.push({ key, value })
                }

                return dataStore.getAppsDataStore().updateAppDefinitionInDb(
                    appName,
                    app.projectId || '',
                    app.description,
                    app.instanceCount,
                    app.captainDefinitionRelativeFilePath,
                    envVars,
                    app.volumes,
                    app.tags || [],
                    app.nodeId || '',
                    app.notExposeAsWebApp,
                    app.containerHttpPort || 80,
                    app.httpAuth,
                    app.forceSsl,
                    app.ports,
                    app.appPushWebhook?.repoInfo || {
                        repo: '',
                        branch: '',
                        user: '',
                        password: '',
                    },
                    null as any,
                    app.customNginxConfig || '',
                    app.redirectDomain || '',
                    app.preDeployFunction || '',
                    app.serviceUpdateOverride || '',
                    app.websocketSupport,
                    app.appDeployTokenConfig || { enabled: false },
                    app.serviceType
                )
            })
            .then(function () {
                Logger.d(
                    `Service env var set: ${appName} - ${key}=${value.substring(0, 10)}...`
                )
                return { key, value }
            })
    }

    /**
     * Delete service-level environment variable
     */
    deleteServiceEnvVar(appName: string, key: string) {
        const dataStore = this.dataStore

        return Promise.resolve()
            .then(function () {
                return dataStore.getAppsDataStore().getAppDefinition(appName)
            })
            .then(function (app) {
                const filteredEnvVars = (app.envVars || []).filter(
                    (v) => v.key !== key
                )

                return dataStore.getAppsDataStore().updateAppDefinitionInDb(
                    appName,
                    app.projectId || '',
                    app.description,
                    app.instanceCount,
                    app.captainDefinitionRelativeFilePath,
                    filteredEnvVars,
                    app.volumes,
                    app.tags || [],
                    app.nodeId || '',
                    app.notExposeAsWebApp,
                    app.containerHttpPort || 80,
                    app.httpAuth,
                    app.forceSsl,
                    app.ports,
                    app.appPushWebhook?.repoInfo || {
                        repo: '',
                        branch: '',
                        user: '',
                        password: '',
                    },
                    null as any,
                    app.customNginxConfig || '',
                    app.redirectDomain || '',
                    app.preDeployFunction || '',
                    app.serviceUpdateOverride || '',
                    app.websocketSupport,
                    app.appDeployTokenConfig || { enabled: false },
                    app.serviceType
                )
            })
            .then(function () {
                Logger.d(`Service env var deleted: ${appName} - ${key}`)
            })
    }
}

export default EnvVarManager
