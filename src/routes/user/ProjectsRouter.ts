import express = require('express')
import ApiStatusCodes from '../../api/ApiStatusCodes'
import BaseApi from '../../api/BaseApi'
import { registerProject } from '../../handlers/users/ProjectHandler'
import InjectionExtractor from '../../injection/InjectionExtractor'
import {
    ProjectDefinition,
    ServiceReference,
} from '../../models/ProjectDefinition'
import Logger from '../../utils/Logger'
import DatabaseTemplateManager from '../../user/DatabaseTemplateManager'
import EnvVarManager from '../../user/EnvVarManager'
import ServiceConnectionManager from '../../user/ServiceConnectionManager'
import { ServiceType } from '../../models/ServiceType'

const router = express.Router()

router.post('/register/', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore

    const projectName = `${req.body.name || ''}`.trim()
    const parentProjectId = `${req.body.parentProjectId || ''}`.trim()
    const description = `${req.body.description || ''}`.trim()

    return registerProject(
        { name: projectName, parentProjectId, description },
        dataStore
    )
        .then(function (result) {
            const resp = new BaseApi(ApiStatusCodes.STATUS_OK, result.message)
            if (result.data) {
                resp.data = result.data
            }
            res.send(resp)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/delete/', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore

    const projectIds = (req.body.projectIds || []).map((id: string) =>
        `${id}`.trim()
    )

    Promise.resolve()
        .then(function () {
            return dataStore //
                .getProjectsDataStore()
                .deleteProjects(projectIds)
        })
        .then(function () {
            Logger.d(`Projects are deleted: ${projectIds}`)
            res.send(new BaseApi(ApiStatusCodes.STATUS_OK, 'Project deleted'))
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/update/', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore

    const projectDefinition = req.body.projectDefinition as
        | ProjectDefinition
        | undefined

    Promise.resolve()
        .then(function () {
            if (!projectDefinition) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.ILLEGAL_OPERATION,
                    'Project Definition is not provided'
                )
            }

            projectDefinition.id = `${projectDefinition.id || ''}`
            projectDefinition.name = `${projectDefinition.name || ''}`
            projectDefinition.parentProjectId = `${
                projectDefinition.parentProjectId || ''
            }`
            projectDefinition.description = `${
                projectDefinition.description || ''
            }`

            if (!projectDefinition.id) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.ILLEGAL_OPERATION,
                    'Project ID is not provided'
                )
            }

            return dataStore
                .getProjectsDataStore()
                .saveProject(projectDefinition.id, {
                    id: projectDefinition.id,
                    name: projectDefinition.name,
                    parentProjectId: projectDefinition.parentProjectId,
                    description: projectDefinition.description,
                })
        })
        .then(function () {
            Logger.d(`Project is saved: ${projectDefinition?.name}`)
            res.send(new BaseApi(ApiStatusCodes.STATUS_OK, 'Project Saved'))
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.get('/', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore

    return dataStore
        .getProjectsDataStore()
        .getAllProjects()
        .then(function (projects) {
            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Projects are retrieved.'
            )
            baseApi.data = {
                projects: projects,
            }

            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.get('/:projectId/overview', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()

    let project: ProjectDefinition
    let services: any[] = []

    return Promise.resolve()
        .then(function () {
            return Promise.all([
                dataStore.getProjectsDataStore().getProject(projectId),
                dataStore.getAppsDataStore().getAppDefinitions(),
            ])
        })
        .then(function ([proj, allApps]) {
            project = proj

            const appsList = Object.keys(allApps).map((key) => ({
                ...allApps[key],
                appName: key,
            }))
            services = appsList.filter((app) => app.projectId === projectId)

            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Project overview retrieved'
            )
            baseApi.data = {
                project: project,
                services: services,
            }

            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.get('/:projectId/env', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()

    const envVarManager = new EnvVarManager(dataStore)

    return envVarManager
        .getProjectEnvVars(projectId)
        .then(function (envVars) {
            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Project environment variables retrieved'
            )
            baseApi.data = { envVars }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/:projectId/env', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()
    const key = `${req.body.key || ''}`.trim()
    const value = `${req.body.value || ''}`

    const envVarManager = new EnvVarManager(dataStore)

    return envVarManager
        .setProjectEnvVar(projectId, key, value)
        .then(function (envVar) {
            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Project environment variable saved'
            )
            baseApi.data = { envVar }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.delete('/:projectId/env/:key', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()
    const key = `${req.params.key || ''}`.trim()

    const envVarManager = new EnvVarManager(dataStore)

    return envVarManager
        .deleteProjectEnvVar(projectId, key)
        .then(function () {
            res.send(
                new BaseApi(
                    ApiStatusCodes.STATUS_OK,
                    'Project environment variable deleted'
                )
            )
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/:projectId/services', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()
    const appName = `${req.body.appName || ''}`.trim()
    const serviceType = req.body.serviceType as ServiceType
    const displayName = `${req.body.displayName || ''}`.trim()

    let project: ProjectDefinition

    return Promise.resolve()
        .then(function () {
            return dataStore.getProjectsDataStore().getProject(projectId)
        })
        .then(function (proj) {
            project = proj

            return dataStore.getAppsDataStore().getAppDefinition(appName)
        })
        .then(function (app) {
            if (app.projectId !== projectId) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.ILLEGAL_OPERATION,
                    'Service does not belong to this project'
                )
            }

            const services = project.services || []
            const existingService = services.find((s) => s.appName === appName)

            if (!existingService) {
                const newService: ServiceReference = {
                    appName,
                    serviceType,
                    displayName: displayName || appName,
                    connections: [],
                    order: services.length,
                }
                services.push(newService)
                project.services = services
                project.updatedAt = new Date().toISOString()

                return dataStore
                    .getProjectsDataStore()
                    .saveProject(projectId, project)
            }
        })
        .then(function () {
            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Service added to project'
            )
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.put('/:projectId/services/:serviceName', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()
    const serviceName = `${req.params.serviceName || ''}`.trim()
    const displayName = req.body.displayName
    const serviceType = req.body.serviceType as ServiceType

    let project: ProjectDefinition

    return Promise.resolve()
        .then(function () {
            return dataStore.getProjectsDataStore().getProject(projectId)
        })
        .then(function (proj) {
            project = proj

            const services = project.services || []
            const service = services.find((s) => s.appName === serviceName)

            if (!service) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.NOT_FOUND,
                    'Service not found in project'
                )
            }

            if (displayName) {
                service.displayName = displayName
            }
            if (serviceType) {
                service.serviceType = serviceType
            }

            project.updatedAt = new Date().toISOString()

            return dataStore
                .getProjectsDataStore()
                .saveProject(projectId, project)
        })
        .then(function () {
            res.send(
                new BaseApi(
                    ApiStatusCodes.STATUS_OK,
                    'Service metadata updated'
                )
            )
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.delete('/:projectId/services/:serviceName', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()
    const serviceName = `${req.params.serviceName || ''}`.trim()

    let project: ProjectDefinition

    return Promise.resolve()
        .then(function () {
            return dataStore.getProjectsDataStore().getProject(projectId)
        })
        .then(function (proj) {
            project = proj

            const services = project.services || []
            project.services = services.filter((s) => s.appName !== serviceName)
            project.updatedAt = new Date().toISOString()

            return dataStore
                .getProjectsDataStore()
                .saveProject(projectId, project)
        })
        .then(function () {
            res.send(
                new BaseApi(
                    ApiStatusCodes.STATUS_OK,
                    'Service removed from project'
                )
            )
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/:projectId/databases', function (req, res, next) {
    const user = InjectionExtractor.extractUserFromInjected(res).user
    const dataStore = user.dataStore
    const serviceManager = user.serviceManager
    const projectId = `${req.params.projectId || ''}`.trim()
    const dbType = req.body.type as 'postgres' | 'mysql' | 'redis' | 'mongodb'
    const name = `${req.body.name || ''}`.trim()
    const version = req.body.version

    const dbManager = new DatabaseTemplateManager(dataStore, serviceManager)
    let createdApp: any
    let project: ProjectDefinition

    return Promise.resolve()
        .then(function () {
            return dbManager.createDatabase(projectId, dbType, name, version)
        })
        .then(function (app) {
            createdApp = app

            return dataStore.getProjectsDataStore().getProject(projectId)
        })
        .then(function (proj) {
            project = proj

            const services = project.services || []
            const newService: ServiceReference = {
                appName: name,
                serviceType: ServiceType.DATABASE,
                displayName: `${dbType} ${version || ''}`.trim(),
                connections: [],
                order: services.length,
            }

            services.push(newService)
            project.services = services
            project.updatedAt = new Date().toISOString()

            return dataStore
                .getProjectsDataStore()
                .saveProject(projectId, project)
        })
        .then(function () {
            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Database created successfully'
            )
            baseApi.data = { app: createdApp }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/:projectId/connections', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()
    const fromService = `${req.body.fromService || ''}`.trim()
    const toService = `${req.body.toService || ''}`.trim()

    const connectionManager = new ServiceConnectionManager(dataStore)

    return connectionManager
        .connectServices(projectId, fromService, toService)
        .then(function (result) {
            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Services connected successfully'
            )
            baseApi.data = result
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.delete('/:projectId/connections', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()
    const fromService = `${req.body.fromService || ''}`.trim()
    const toService = `${req.body.toService || ''}`.trim()

    const connectionManager = new ServiceConnectionManager(dataStore)

    return connectionManager
        .disconnectServices(projectId, fromService, toService)
        .then(function (result) {
            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Services disconnected successfully'
            )
            baseApi.data = result
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.get('/:projectId/deployments', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.params.projectId || ''}`.trim()

    let services: any[] = []
    let deployments: any[] = []

    return Promise.resolve()
        .then(function () {
            return dataStore.getAppsDataStore().getAppDefinitions()
        })
        .then(function (allApps) {
            const appsList = Object.keys(allApps).map((key) => allApps[key])
            services = appsList.filter((app) => app.projectId === projectId)

            services.forEach((service) => {
                const versions = service.versions || []
                versions.forEach((version: any) => {
                    deployments.push({
                        serviceName: service.appName,
                        displayName: service.displayName || service.appName,
                        version: version.version,
                        deployedImageName: version.deployedImageName,
                        timeStamp: version.timeStamp,
                        gitHash: version.gitHash,
                    })
                })
            })

            deployments.sort(
                (a, b) =>
                    new Date(b.timeStamp).getTime() -
                    new Date(a.timeStamp).getTime()
            )

            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Project deployments retrieved'
            )
            baseApi.data = { deployments }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

export default router
