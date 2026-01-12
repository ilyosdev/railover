import express = require('express')
import ApiStatusCodes from '../../api/ApiStatusCodes'
import BaseApi from '../../api/BaseApi'
import InjectionExtractor from '../../injection/InjectionExtractor'
import { UserRole } from '../../models/UserDefinition'
import { UserManagerExtended } from '../../user/UserManagerExtended'

const router = express.Router()

function requireSuperAdmin(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    const injected = InjectionExtractor.extractUserFromInjected(res)
    const dataStore = injected.user.dataStore
    const currentUsername = injected.user.currentUsername || 'admin'

    Promise.resolve()
        .then(function () {
            return dataStore.getUserByUsername(currentUsername)
        })
        .then(function (currentUser) {
            if (!currentUser) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                    'User not found'
                )
            }

            if (currentUser.role !== UserRole.SUPER_ADMIN) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                    'Only Super Admin can manage users'
                )
            }

            res.locals.currentUser = currentUser
            next()
        })
        .catch(ApiStatusCodes.createCatcher(res))
}

function requireProjectAdmin(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
) {
    const injected = InjectionExtractor.extractUserFromInjected(res)
    const dataStore = injected.user.dataStore
    const currentUsername = injected.user.currentUsername || 'admin'
    const projectId = `${req.params.projectId || ''}`

    Promise.resolve()
        .then(function () {
            return dataStore.getUserByUsername(currentUsername)
        })
        .then(function (currentUser) {
            if (!currentUser) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                    'User not found'
                )
            }

            if (currentUser.role === UserRole.SUPER_ADMIN) {
                res.locals.currentUser = currentUser
                return next()
            }

            return dataStore
                .getProjectsDataStore()
                .getProject(projectId)
                .then(function (project) {
                    if (!project) {
                        throw ApiStatusCodes.createError(
                            ApiStatusCodes.NOT_FOUND,
                            'Project not found'
                        )
                    }

                    if (project.ownerId === currentUser.id) {
                        res.locals.currentUser = currentUser
                        return next()
                    }

                    if (project.collaborators) {
                        const collaborator = project.collaborators.find(
                            (c) => c.userId === currentUser.id
                        )
                        if (collaborator && collaborator.role === 'admin') {
                            res.locals.currentUser = currentUser
                            return next()
                        }
                    }

                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                        'You do not have permission to manage this project'
                    )
                })
        })
        .catch(ApiStatusCodes.createCatcher(res))
}

router.post('/create', requireSuperAdmin, function (req, res, next) {
    const injected = InjectionExtractor.extractUserFromInjected(res)
    const dataStore = injected.user.dataStore
    const currentUser = res.locals.currentUser
    const userManagerExtended = new UserManagerExtended(dataStore)

    const { username, email, password, role } = req.body

    Promise.resolve()
        .then(function () {
            return userManagerExtended.createUser(currentUser, {
                username,
                email,
                password,
                role,
            })
        })
        .then(function (newUser) {
            const sanitizedUser = { ...newUser }
            delete (sanitizedUser as any).passwordHash

            const response = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'User created successfully'
            )
            response.data = sanitizedUser
            res.send(response)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.get('/', requireSuperAdmin, function (req, res, next) {
    const injected = InjectionExtractor.extractUserFromInjected(res)
    const dataStore = injected.user.dataStore
    const currentUser = res.locals.currentUser
    const userManagerExtended = new UserManagerExtended(dataStore)

    Promise.resolve()
        .then(function () {
            return userManagerExtended.listUsers(currentUser)
        })
        .then(function (users) {
            const response = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Users retrieved successfully'
            )
            response.data = { users }
            res.send(response)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

router.put('/:userId/role', requireSuperAdmin, function (req, res, next) {
    const injected = InjectionExtractor.extractUserFromInjected(res)
    const dataStore = injected.user.dataStore
    const currentUser = res.locals.currentUser
    const userManagerExtended = new UserManagerExtended(dataStore)

    const userId = `${req.params.userId || ''}`
    const { role } = req.body

    Promise.resolve()
        .then(function () {
            return userManagerExtended.updateUserRole(currentUser, userId, role)
        })
        .then(function () {
            res.send(
                new BaseApi(
                    ApiStatusCodes.STATUS_OK,
                    'User role updated successfully'
                )
            )
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

function deleteUserHandler(req: express.Request, res: express.Response) {
    const injected = InjectionExtractor.extractUserFromInjected(res)
    const dataStore = injected.user.dataStore
    const currentUser = res.locals.currentUser
    const userManagerExtended = new UserManagerExtended(dataStore)

    const userId = `${req.params.userId || ''}`

    Promise.resolve()
        .then(function () {
            return userManagerExtended.deleteUser(currentUser, userId)
        })
        .then(function () {
            res.send(
                new BaseApi(
                    ApiStatusCodes.STATUS_OK,
                    'User deleted successfully'
                )
            )
        })
        .catch(ApiStatusCodes.createCatcher(res))
}

router.delete('/:userId', requireSuperAdmin, deleteUserHandler)
router.post('/:userId/delete', requireSuperAdmin, deleteUserHandler)

router.get(
    '/projects/:projectId/collaborators',
    requireProjectAdmin,
    function (req, res, next) {
        const injected = InjectionExtractor.extractUserFromInjected(res)
        const dataStore = injected.user.dataStore
        const projectId = `${req.params.projectId || ''}`

        Promise.resolve()
            .then(function () {
                return dataStore.getProjectsDataStore().getProject(projectId)
            })
            .then(function (project) {
                if (!project) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.NOT_FOUND,
                        'Project not found'
                    )
                }

                const response = new BaseApi(
                    ApiStatusCodes.STATUS_OK,
                    'Collaborators retrieved successfully'
                )
                response.data = { collaborators: project.collaborators || [] }
                res.send(response)
            })
            .catch(ApiStatusCodes.createCatcher(res))
    }
)

router.post(
    '/projects/:projectId/collaborators',
    requireProjectAdmin,
    function (req, res, next) {
        const injected = InjectionExtractor.extractUserFromInjected(res)
        const dataStore = injected.user.dataStore
        const currentUser = res.locals.currentUser
        const userManagerExtended = new UserManagerExtended(dataStore)

        const projectId = `${req.params.projectId || ''}`
        const { userId, role } = req.body

        Promise.resolve()
            .then(function () {
                return userManagerExtended.addCollaboratorToProject(
                    currentUser,
                    projectId,
                    userId,
                    role
                )
            })
            .then(function () {
                res.send(
                    new BaseApi(
                        ApiStatusCodes.STATUS_OK,
                        'Collaborator added successfully'
                    )
                )
            })
            .catch(ApiStatusCodes.createCatcher(res))
    }
)

router.delete(
    '/projects/:projectId/collaborators/:userId',
    requireProjectAdmin,
    function (req, res, next) {
        const injected = InjectionExtractor.extractUserFromInjected(res)
        const dataStore = injected.user.dataStore
        const currentUser = res.locals.currentUser
        const userManagerExtended = new UserManagerExtended(dataStore)

        const projectId = `${req.params.projectId || ''}`
        const userId = `${req.params.userId || ''}`

        Promise.resolve()
            .then(function () {
                return userManagerExtended.removeCollaboratorFromProject(
                    currentUser,
                    projectId,
                    userId
                )
            })
            .then(function () {
                res.send(
                    new BaseApi(
                        ApiStatusCodes.STATUS_OK,
                        'Collaborator removed successfully'
                    )
                )
            })
            .catch(ApiStatusCodes.createCatcher(res))
    }
)

router.get('/projects', function (req, res, next) {
    const injected = InjectionExtractor.extractUserFromInjected(res)
    const dataStore = injected.user.dataStore
    const currentUsername = injected.user.currentUsername || 'admin'

    Promise.resolve()
        .then(function () {
            return dataStore.getUserByUsername(currentUsername)
        })
        .then(function (currentUser) {
            if (!currentUser) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                    'User not found'
                )
            }

            const userManagerExtended = new UserManagerExtended(dataStore)
            return userManagerExtended.getUserProjects(currentUser.id)
        })
        .then(function (projects) {
            const response = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Projects retrieved successfully'
            )
            response.data = { projects }
            res.send(response)
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

export default router
