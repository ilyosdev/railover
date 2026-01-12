import express = require('express')
import ApiStatusCodes from '../../../api/ApiStatusCodes'
import BaseApi from '../../../api/BaseApi'
import DataStoreProvider from '../../../datastore/DataStoreProvider'
import {
    GitHubIntegration,
    ProjectDefinition,
} from '../../../models/ProjectDefinition'
import InjectionExtractor from '../../../injection/InjectionExtractor'
import Logger from '../../../utils/Logger'
import { UserManagerProvider } from '../../../user/UserManagerProvider'
import CaptainConstants from '../../../utils/CaptainConstants'

const router = express.Router()

router.post('/connect', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.body.projectId || ''}`.trim()
    const repo = `${req.body.repo || ''}`.trim()
    const branch = `${req.body.branch || 'main'}`.trim()
    const autoDeployEnabled = req.body.autoDeployEnabled !== false

    let project: any

    return Promise.resolve()
        .then(function () {
            if (!projectId || !repo) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.ILLEGAL_PARAMETER,
                    'Project ID and repository are required'
                )
            }

            return dataStore.getProjectsDataStore().getProject(projectId)
        })
        .then(function (proj) {
            project = proj

            const githubIntegration: GitHubIntegration = {
                repo,
                branch,
                autoDeployEnabled,
            }

            project.githubIntegration = githubIntegration
            project.updatedAt = new Date().toISOString()

            return dataStore
                .getProjectsDataStore()
                .saveProject(projectId, project)
        })
        .then(function () {
            Logger.d(
                `GitHub connected to project ${projectId}: ${repo}@${branch}`
            )

            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'GitHub repository connected to project'
            )
            baseApi.data = {
                projectId,
                repo,
                branch,
                autoDeployEnabled,
            }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/disconnect', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const projectId = `${req.body.projectId || ''}`.trim()

    let project: any

    return Promise.resolve()
        .then(function () {
            return dataStore.getProjectsDataStore().getProject(projectId)
        })
        .then(function (proj) {
            project = proj

            project.githubIntegration = undefined
            project.updatedAt = new Date().toISOString()

            return dataStore
                .getProjectsDataStore()
                .saveProject(projectId, project)
        })
        .then(function () {
            Logger.d(`GitHub disconnected from project ${projectId}`)

            res.send(
                new BaseApi(
                    ApiStatusCodes.STATUS_OK,
                    'GitHub repository disconnected from project'
                )
            )
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/webhook', function (req, res, next) {
    const event = req.headers['x-github-event'] as string
    const payload = req.body

    Logger.d(`GitHub webhook received: ${event}`)

    if (event === 'ping') {
        res.send(
            new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Webhook ping received successfully'
            )
        )
        return
    }

    if (event === 'push') {
        const repository = payload.repository?.full_name as string
        const branch = (payload.ref || '').replace('refs/heads/', '')
        const commitSha = payload.after || payload.head_commit?.id || ''
        const commitMessage = payload.head_commit?.message || ''

        Logger.d(
            `Push event received for ${repository}@${branch}: ${commitSha.substring(0, 7)}`
        )

        handlePushEvent(repository, branch, commitSha, commitMessage)
            .then(function (result) {
                Logger.d(`Auto-deploy result: ${JSON.stringify(result)}`)
            })
            .catch(function (err) {
                Logger.e(`Auto-deploy error: ${err.message || err}`)
            })

        res.send(
            new BaseApi(
                ApiStatusCodes.STATUS_OK,
                `Push event received for ${repository}@${branch}, auto-deploy triggered`
            )
        )
        return
    }

    res.send(
        new BaseApi(ApiStatusCodes.STATUS_OK, `GitHub event ${event} received`)
    )
})

async function handlePushEvent(
    repo: string,
    branch: string,
    commitSha: string,
    _commitMessage: string
): Promise<any> {
    const namespace = CaptainConstants.rootNameSpace
    const userManager = UserManagerProvider.get(namespace)
    const dataStore = DataStoreProvider.getDataStore(namespace)

    const projects = await dataStore.getProjectsDataStore().getAllProjects()

    let matchingProject: ProjectDefinition | null = null

    for (const project of projects) {
        if (
            project.githubIntegration?.repo === repo &&
            project.githubIntegration?.branch === branch &&
            project.githubIntegration?.autoDeployEnabled !== false
        ) {
            matchingProject = project
            break
        }
    }

    if (!matchingProject) {
        Logger.d(
            `No matching project found for ${repo}@${branch} or auto-deploy disabled`
        )
        return { deployed: false, reason: 'No matching project' }
    }

    Logger.d(
        `Found matching project: ${matchingProject.name} (${matchingProject.id})`
    )

    const allApps = await dataStore.getAppsDataStore().getAppDefinitions()

    const appsList = Object.keys(allApps).map((key) => ({
        ...(allApps as any)[key],
        appName: key,
    }))

    const projectServices = appsList.filter(
        (app) => app.projectId === matchingProject!.id
    )

    if (projectServices.length === 0) {
        Logger.d(`No services found in project ${matchingProject.name}`)
        return { deployed: false, reason: 'No services in project' }
    }

    const affectedServices = projectServices
        .filter((s) => !isDatabase(s))
        .map((s) => s.appName || '')
        .filter((n) => n)

    Logger.d(
        `Triggering deploy for ${affectedServices.length} service(s): ${affectedServices.join(', ')}`
    )

    const deployPromises = affectedServices.map(function (appName) {
        return triggerGitDeploy(userManager, appName, commitSha)
    })

    const results = await Promise.all(deployPromises)

    return {
        deployed: true,
        services: affectedServices,
        results,
    }
}

function isDatabase(app: any): boolean {
    const tags = app.tags || []
    const appName = (app.appName || '').toLowerCase()
    const dbKeywords = [
        'postgres',
        'mysql',
        'redis',
        'mongodb',
        'mongo',
        'mariadb',
    ]

    return (
        tags.some((t: any) => t.tagName === 'database') ||
        dbKeywords.some((kw) => appName.includes(kw))
    )
}

function triggerGitDeploy(
    userManager: any,
    appName: string,
    commitSha: string
) {
    const serviceManager = userManager.getServiceManager()

    Logger.d(
        `Triggering deploy for ${appName} (commit: ${commitSha.substring(0, 7)})`
    )

    return serviceManager
        .scheduleDeployNewVersion(appName, {
            repoInfoSource: {
                gitHash: commitSha,
            },
        })
        .then(function () {
            Logger.d(`Deploy scheduled successfully for ${appName}`)
            return { appName, success: true }
        })
        .catch(function (err: any) {
            Logger.e(`Deploy failed for ${appName}: ${err.message || err}`)
            return { appName, success: false, error: err.message || err }
        })
}

router.get('/repos', function (req, res, next) {
    const baseApi = new BaseApi(
        ApiStatusCodes.STATUS_OK,
        'GitHub repositories list (not yet implemented)'
    )
    baseApi.data = {
        repos: [],
        message:
            'GitHub App integration required. See documentation for setup.',
    }
    res.send(baseApi)
})

export default router
