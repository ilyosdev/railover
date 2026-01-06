import ApiStatusCodes from '../api/ApiStatusCodes'
import DataStore from '../datastore/DataStore'
import { IAppEnvVar } from '../models/AppDefinition'
import { ServiceType } from '../models/ServiceType'
import Logger from '../utils/Logger'
import DatabaseTemplateManager from './DatabaseTemplateManager'

interface ServiceConnection {
    fromService: string
    toService: string
}

class ServiceConnectionManager {
    private dbManager: DatabaseTemplateManager

    constructor(private dataStore: DataStore) {
        this.dbManager = new DatabaseTemplateManager(dataStore)
    }

    connectServices(projectId: string, fromService: string, toService: string) {
        const self = this
        const dataStore = this.dataStore
        let fromApp: any
        let toApp: any
        let project: any

        return Promise.resolve()
            .then(function () {
                return Promise.all([
                    dataStore.getAppsDataStore().getAppDefinition(fromService),
                    dataStore.getAppsDataStore().getAppDefinition(toService),
                    dataStore.getProjectsDataStore().getProject(projectId),
                ])
            })
            .then(function ([from, to, proj]) {
                fromApp = from
                toApp = to
                project = proj

                if (fromApp.projectId !== projectId) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_OPERATION,
                        `Service ${fromService} does not belong to project ${projectId}`
                    )
                }

                if (toApp.projectId !== projectId) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_OPERATION,
                        `Service ${toService} does not belong to project ${projectId}`
                    )
                }

                const toServiceType = self.getServiceType(toApp)

                if (toServiceType === ServiceType.DATABASE) {
                    return self.connectToDatabase(fromApp, toApp, toService)
                } else {
                    return self.connectToService(fromApp, toApp, toService)
                }
            })
            .then(function (connectionEnvVars) {
                fromApp.envVars = fromApp.envVars || []

                connectionEnvVars.forEach((envVar: IAppEnvVar) => {
                    const existingIndex = fromApp.envVars.findIndex(
                        (v: IAppEnvVar) => v.key === envVar.key
                    )
                    if (existingIndex >= 0) {
                        fromApp.envVars[existingIndex] = envVar
                    } else {
                        fromApp.envVars.push(envVar)
                    }
                })

                return dataStore.getAppsDataStore().updateAppDefinitionInDb(
                    fromService,
                    fromApp.projectId || '',
                    fromApp.description,
                    fromApp.instanceCount,
                    fromApp.captainDefinitionRelativeFilePath,
                    fromApp.envVars,
                    fromApp.volumes,
                    fromApp.tags || [],
                    fromApp.nodeId || '',
                    fromApp.notExposeAsWebApp,
                    fromApp.containerHttpPort || 80,
                    fromApp.httpAuth,
                    fromApp.forceSsl,
                    fromApp.ports,
                    fromApp.appPushWebhook?.repoInfo || {
                        repo: '',
                        branch: '',
                        user: '',
                        password: '',
                    },
                    null as any,
                    fromApp.customNginxConfig || '',
                    fromApp.redirectDomain || '',
                    fromApp.preDeployFunction || '',
                    fromApp.serviceUpdateOverride || '',
                    fromApp.websocketSupport,
                    fromApp.appDeployTokenConfig || { enabled: false }
                )
            })
            .then(function () {
                const services = project.services || []
                const fromServiceRef = services.find(
                    (s: any) => s.appName === fromService
                )

                if (fromServiceRef) {
                    fromServiceRef.connections =
                        fromServiceRef.connections || []
                    if (!fromServiceRef.connections.includes(toService)) {
                        fromServiceRef.connections.push(toService)
                    }

                    project.updatedAt = new Date().toISOString()
                    return dataStore
                        .getProjectsDataStore()
                        .saveProject(projectId, project)
                }
            })
            .then(function () {
                Logger.d(
                    `Services connected: ${fromService} -> ${toService} in project ${projectId}`
                )
                return {
                    fromService,
                    toService,
                    status: 'connected',
                }
            })
    }

    private getServiceType(app: any): ServiceType {
        if (app.serviceType) {
            return app.serviceType as ServiceType
        }

        const tags = app.tags || []
        if (tags.some((t: any) => t.tagName === 'database')) {
            return ServiceType.DATABASE
        }

        return ServiceType.BACKEND
    }

    private connectToDatabase(fromApp: any, dbApp: any, dbServiceName: string) {
        const self = this
        const dbName = dbServiceName

        return Promise.resolve().then(function () {
            const tags = dbApp.tags || []
            const dbTag = tags.find((t: any) =>
                ['postgres', 'mysql', 'redis', 'mongodb'].includes(t.tagName)
            )

            if (!dbTag) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.ILLEGAL_OPERATION,
                    'Unable to determine database type'
                )
            }

            const dbType = dbTag.tagName as
                | 'postgres'
                | 'mysql'
                | 'redis'
                | 'mongodb'

            return self.dbManager
                .getDatabasePassword(dbName)
                .then(function (password) {
                    return self.dbManager.getConnectionEnvVars(
                        dbType,
                        dbName,
                        password
                    )
                })
        })
    }

    private connectToService(fromApp: any, toApp: any, toServiceName: string) {
        const serviceName = toServiceName
        const envVars: IAppEnvVar[] = []

        const serviceUrlKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_URL`
        const serviceHostKey = `${serviceName.toUpperCase().replace(/-/g, '_')}_HOST`

        envVars.push({
            key: serviceUrlKey,
            value: `http://srv-captain--${serviceName}`,
        })

        envVars.push({
            key: serviceHostKey,
            value: `srv-captain--${serviceName}`,
        })

        return Promise.resolve(envVars)
    }

    disconnectServices(
        projectId: string,
        fromService: string,
        toService: string
    ) {
        const dataStore = this.dataStore
        let project: any

        return Promise.resolve()
            .then(function () {
                return Promise.all([
                    dataStore.getAppsDataStore().getAppDefinition(fromService),
                    dataStore.getProjectsDataStore().getProject(projectId),
                ])
            })
            .then(function ([_from, proj]) {
                project = proj

                const services = project.services || []
                const fromServiceRef = services.find(
                    (s: any) => s.appName === fromService
                )

                if (fromServiceRef && fromServiceRef.connections) {
                    fromServiceRef.connections =
                        fromServiceRef.connections.filter(
                            (c: string) => c !== toService
                        )
                    project.updatedAt = new Date().toISOString()
                }

                return dataStore
                    .getProjectsDataStore()
                    .saveProject(projectId, project)
            })
            .then(function () {
                Logger.d(
                    `Services disconnected: ${fromService} -> ${toService} in project ${projectId}`
                )
                return {
                    fromService,
                    toService,
                    status: 'disconnected',
                }
            })
    }

    getServiceConnections(projectId: string) {
        const dataStore = this.dataStore

        return Promise.resolve()
            .then(function () {
                return dataStore.getProjectsDataStore().getProject(projectId)
            })
            .then(function (project) {
                const services = project.services || []
                const connections: ServiceConnection[] = []

                services.forEach((service: any) => {
                    if (service.connections) {
                        service.connections.forEach((toService: string) => {
                            connections.push({
                                fromService: service.appName,
                                toService,
                            })
                        })
                    }
                })

                return connections
            })
    }
}

export default ServiceConnectionManager
