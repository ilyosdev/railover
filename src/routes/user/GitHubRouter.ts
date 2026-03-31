import express = require('express')
import ApiStatusCodes from '../../api/ApiStatusCodes'
import BaseApi from '../../api/BaseApi'
import { updateAppDefinition } from '../../handlers/users/apps/appdefinition/AppDefinitionHandler'
import InjectionExtractor from '../../injection/InjectionExtractor'
import Logger from '../../utils/Logger'

const router = express.Router()

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || ''
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || ''
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || ''

interface GitHubTokenResponse {
    access_token: string
    token_type: string
    scope: string
}

interface GitHubRepo {
    id: number
    name: string
    full_name: string
    private: boolean
    html_url: string
    clone_url: string
    ssh_url: string
    default_branch: string
    owner: {
        login: string
    }
}

interface GitHubUser {
    login: string
    id: number
    avatar_url: string
    name: string
}

router.get('/auth-url', function (req, res, next) {
    if (!GITHUB_CLIENT_ID) {
        return res.send(
            new BaseApi(
                ApiStatusCodes.STATUS_ERROR_GENERIC,
                'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID environment variable.'
            )
        )
    }

    const state = Math.random().toString(36).substring(7)
    const scope = 'repo admin:repo_hook read:user'

    const authUrl =
        `https://github.com/login/oauth/authorize?` +
        `client_id=${GITHUB_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent(GITHUB_REDIRECT_URI)}` +
        `&scope=${encodeURIComponent(scope)}` +
        `&state=${state}`

    const baseApi = new BaseApi(ApiStatusCodes.STATUS_OK, 'GitHub auth URL')
    baseApi.data = {
        authUrl,
        state,
        configured: true,
    }
    res.send(baseApi)
})

router.get('/status', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore

    return Promise.resolve()
        .then(function () {
            return dataStore.getGitHubToken()
        })
        .then(function (token) {
            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'GitHub status'
            )
            baseApi.data = {
                configured: !!GITHUB_CLIENT_ID,
                connected: !!token,
            }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/callback', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const code = `${req.body.code || ''}`.trim()

    if (!code) {
        return res.send(
            ApiStatusCodes.createError(
                ApiStatusCodes.ILLEGAL_PARAMETER,
                'Authorization code is required'
            )
        )
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
        return res.send(
            ApiStatusCodes.createError(
                ApiStatusCodes.STATUS_ERROR_GENERIC,
                'GitHub OAuth is not configured'
            )
        )
    }

    let accessToken: string

    return Promise.resolve()
        .then(function () {
            return fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    client_id: GITHUB_CLIENT_ID,
                    client_secret: GITHUB_CLIENT_SECRET,
                    code: code,
                    redirect_uri: GITHUB_REDIRECT_URI,
                }),
            })
        })
        .then(function (response) {
            return response.json() as Promise<GitHubTokenResponse>
        })
        .then(function (data) {
            if (!data.access_token) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_ERROR_GENERIC,
                    'Failed to get access token from GitHub'
                )
            }

            accessToken = data.access_token
            return dataStore.setGitHubToken(accessToken)
        })
        .then(function () {
            return fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            })
        })
        .then(function (response) {
            return response.json() as Promise<GitHubUser>
        })
        .then(function (user) {
            Logger.d(`GitHub connected for user: ${user.login}`)

            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'GitHub connected successfully'
            )
            baseApi.data = {
                user: {
                    login: user.login,
                    name: user.name,
                    avatar_url: user.avatar_url,
                },
            }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/disconnect', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore

    return Promise.resolve()
        .then(function () {
            return dataStore.setGitHubToken('')
        })
        .then(function () {
            res.send(
                new BaseApi(
                    ApiStatusCodes.STATUS_OK,
                    'GitHub disconnected successfully'
                )
            )
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.get('/repos', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const page = parseInt(`${req.query.page || '1'}`)
    const perPage = parseInt(`${req.query.per_page || '30'}`)
    const search = `${req.query.search || ''}`.trim().toLowerCase()

    let accessToken: string

    return Promise.resolve()
        .then(function () {
            return dataStore.getGitHubToken()
        })
        .then(function (token) {
            if (!token) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                    'GitHub is not connected. Please connect your GitHub account first.'
                )
            }
            accessToken = token

            return fetch(
                `https://api.github.com/user/repos?page=${page}&per_page=${perPage}&sort=updated&affiliation=owner,collaborator,organization_member`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            )
        })
        .then(function (response) {
            return response.json() as Promise<GitHubRepo[]>
        })
        .then(function (repos) {
            let filteredRepos = repos
            if (search) {
                filteredRepos = repos.filter(
                    (repo) =>
                        repo.name.toLowerCase().includes(search) ||
                        repo.full_name.toLowerCase().includes(search)
                )
            }

            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Repositories'
            )
            baseApi.data = {
                repos: filteredRepos.map((repo) => ({
                    id: repo.id,
                    name: repo.name,
                    fullName: repo.full_name,
                    private: repo.private,
                    url: repo.html_url,
                    cloneUrl: repo.clone_url,
                    sshUrl: repo.ssh_url,
                    defaultBranch: repo.default_branch,
                    owner: repo.owner.login,
                })),
                page,
                perPage,
            }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.get('/repos/:owner/:repo/branches', function (req, res, next) {
    const dataStore =
        InjectionExtractor.extractUserFromInjected(res).user.dataStore
    const owner = `${req.params.owner || ''}`.trim()
    const repo = `${req.params.repo || ''}`.trim()

    let accessToken: string

    return Promise.resolve()
        .then(function () {
            return dataStore.getGitHubToken()
        })
        .then(function (token) {
            if (!token) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                    'GitHub is not connected'
                )
            }
            accessToken = token

            return fetch(
                `https://api.github.com/repos/${owner}/${repo}/branches`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/vnd.github.v3+json',
                    },
                }
            )
        })
        .then(function (response) {
            return response.json() as Promise<Array<{ name: string }>>
        })
        .then(function (branches) {
            const baseApi = new BaseApi(ApiStatusCodes.STATUS_OK, 'Branches')
            baseApi.data = {
                branches: branches.map((b) => b.name),
            }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.post('/connect-repo', function (req, res, next) {
    const user = InjectionExtractor.extractUserFromInjected(res).user
    const dataStore = user.dataStore
    const serviceManager = user.serviceManager

    const appName = `${req.body.appName || ''}`.trim()
    const repoFullName = `${req.body.repoFullName || ''}`.trim()
    const branch = `${req.body.branch || 'main'}`.trim()

    if (!appName || !repoFullName) {
        return res.send(
            ApiStatusCodes.createError(
                ApiStatusCodes.ILLEGAL_PARAMETER,
                'appName and repoFullName are required'
            )
        )
    }

    const [owner, repo] = repoFullName.split('/')
    if (!owner || !repo) {
        return res.send(
            ApiStatusCodes.createError(
                ApiStatusCodes.ILLEGAL_PARAMETER,
                'Invalid repository format. Use owner/repo'
            )
        )
    }

    let accessToken: string
    let app: any
    let webhookUrl: string

    return Promise.resolve()
        .then(function () {
            return dataStore.getGitHubToken()
        })
        .then(function (token) {
            if (!token) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                    'GitHub is not connected'
                )
            }
            accessToken = token

            return dataStore.getAppsDataStore().getAppDefinition(appName)
        })
        .then(function (appDef) {
            app = appDef

            let pushWebhookToken = app.appPushWebhook?.pushWebhookToken
            if (!pushWebhookToken) {
                pushWebhookToken =
                    Math.random().toString(36).substring(2) +
                    Math.random().toString(36).substring(2)
            }

            const rootDomain = dataStore.getRootDomain()
            webhookUrl = `https://captain.${rootDomain}/api/v2/user/apps/webhooks/triggerbuild?namespace=captain&token=${pushWebhookToken}`

            const repoInfo = {
                repo: `github.com/${repoFullName}`,
                branch: branch,
                user: 'x-access-token',
                password: accessToken,
                sshKey: '',
            }

            return updateAppDefinition(
                {
                    appName: appName,
                    projectId: app.projectId,
                    repoInfo: repoInfo,
                },
                serviceManager
            )
                .then(function () {
                    return dataStore
                        .getAppsDataStore()
                        .getAppDefinition(appName)
                })
                .then(function (updatedApp) {
                    webhookUrl = `https://captain.${rootDomain}/api/v2/user/apps/webhooks/triggerbuild?namespace=captain&token=${updatedApp.appPushWebhook?.pushWebhookToken || ''}`
                })
        })
        .then(function () {
            return fetch(
                `https://api.github.com/repos/${owner}/${repo}/hooks`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        Accept: 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        name: 'web',
                        active: true,
                        events: ['push'],
                        config: {
                            url: webhookUrl,
                            content_type: 'json',
                            insecure_ssl: '0',
                        },
                    }),
                }
            )
        })
        .then(function (response) {
            return response.json()
        })
        .then(function (webhookResult: any) {
            if (webhookResult.errors || webhookResult.message) {
                Logger.w(
                    `GitHub webhook creation warning: ${JSON.stringify(webhookResult)}`
                )
            } else {
                Logger.d(`GitHub webhook created: ${webhookResult.id}`)
            }

            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Repository connected successfully'
            )
            baseApi.data = {
                webhookUrl: webhookUrl,
                repo: repoFullName,
                branch: branch,
            }
            res.send(baseApi)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

export default router
