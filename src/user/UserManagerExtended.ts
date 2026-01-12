import { randomUUID } from 'crypto'
import ApiStatusCodes from '../api/ApiStatusCodes'
import DataStore from '../datastore/DataStore'
import { ProjectDefinition } from '../models/ProjectDefinition'
import {
    UserCollaborator,
    UserDefinition,
    UserPermissions,
    UserRole,
} from '../models/UserDefinition'
import Logger from '../utils/Logger'
import Authenticator from './Authenticator'
import CaptainConstants from '../utils/CaptainConstants'

export class UserManagerExtended {
    private dataStore: DataStore

    constructor(dataStore: DataStore) {
        this.dataStore = dataStore
    }

    createUser(
        adminUser: UserDefinition,
        userData: {
            username: string
            email: string
            password: string
            role: UserRole
        }
    ): Promise<UserDefinition> {
        const self = this

        return Promise.resolve()
            .then(function () {
                if (adminUser.role !== UserRole.SUPER_ADMIN) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                        'Only Super Admin can create users'
                    )
                }

                if (
                    !userData.username ||
                    !userData.email ||
                    !userData.password
                ) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'Username, email, and password are required'
                    )
                }

                if (userData.password.length < 8) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'Password must be at least 8 characters long'
                    )
                }

                if (
                    !/^[a-zA-Z0-9_-]+$/.test(userData.username) ||
                    userData.username.length < 3
                ) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'Username must be at least 3 characters and contain only letters, numbers, underscores, and hyphens'
                    )
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'Invalid email address'
                    )
                }

                return self.dataStore.getUserByUsername(userData.username)
            })
            .then(function (existingUser) {
                if (existingUser) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.STATUS_ERROR_ALREADY_EXIST,
                        'Username already exists'
                    )
                }

                const authenticator = Authenticator.getAuthenticator(
                    CaptainConstants.rootNameSpace
                )
                const passwordHash = authenticator.hashPassword(
                    userData.password
                )

                const permissions = self.getDefaultPermissions(userData.role)

                const newUser: UserDefinition = {
                    id: randomUUID(),
                    username: userData.username,
                    email: userData.email,
                    passwordHash: passwordHash,
                    role: userData.role,
                    permissions: permissions,
                    createdAt: new Date().toISOString(),
                }

                return self.dataStore.saveUser(newUser)
            })
            .then(function (user) {
                Logger.d(
                    `User created: ${user.username} (${user.role}) by ${adminUser.username}`
                )
                return user
            })
    }

    listUsers(currentUser: UserDefinition): Promise<UserDefinition[]> {
        const self = this

        return Promise.resolve()
            .then(function () {
                if (currentUser.role !== UserRole.SUPER_ADMIN) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                        'Only Super Admin can list users'
                    )
                }

                return self.dataStore.getAllUsers()
            })
            .then(function (users) {
                return users.map(function (user) {
                    const sanitizedUser = { ...user }
                    delete (sanitizedUser as any).passwordHash
                    return sanitizedUser
                })
            })
    }

    updateUserRole(
        adminUser: UserDefinition,
        targetUserId: string,
        newRole: UserRole
    ): Promise<void> {
        const self = this

        return Promise.resolve()
            .then(function () {
                if (adminUser.role !== UserRole.SUPER_ADMIN) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                        'Only Super Admin can update user roles'
                    )
                }

                if (!targetUserId || !newRole) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'User ID and new role are required'
                    )
                }

                return self.dataStore.getUser(targetUserId)
            })
            .then(function (targetUser) {
                if (!targetUser) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.NOT_FOUND,
                        'User not found'
                    )
                }

                if (targetUser.id === adminUser.id) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_OPERATION,
                        'Cannot change your own role'
                    )
                }

                targetUser.role = newRole
                targetUser.permissions = self.getDefaultPermissions(newRole)

                return self.dataStore.updateUser(targetUser)
            })
            .then(function () {
                Logger.d(
                    `User role updated: ${targetUserId} to ${newRole} by ${adminUser.username}`
                )
            })
    }

    deleteUser(adminUser: UserDefinition, targetUserId: string): Promise<void> {
        const self = this

        return Promise.resolve()
            .then(function () {
                if (adminUser.role !== UserRole.SUPER_ADMIN) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                        'Only Super Admin can delete users'
                    )
                }

                if (!targetUserId) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'User ID is required'
                    )
                }

                if (targetUserId === adminUser.id) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_OPERATION,
                        'Cannot delete yourself'
                    )
                }

                return self.dataStore.getUser(targetUserId)
            })
            .then(function (targetUser) {
                if (!targetUser) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.NOT_FOUND,
                        'User not found'
                    )
                }

                return self.dataStore.getAllUsers()
            })
            .then(function (allUsers) {
                const superAdminCount = allUsers.filter(
                    (u) => u.role === UserRole.SUPER_ADMIN
                ).length

                if (superAdminCount === 1) {
                    return self.dataStore
                        .getUser(targetUserId)
                        .then(function (targetUser) {
                            if (
                                targetUser &&
                                targetUser.role === UserRole.SUPER_ADMIN
                            ) {
                                throw ApiStatusCodes.createError(
                                    ApiStatusCodes.ILLEGAL_OPERATION,
                                    'Cannot delete the last Super Admin'
                                )
                            }
                        })
                }
            })
            .then(function () {
                return self.dataStore.deleteUser(targetUserId)
            })
            .then(function () {
                Logger.d(
                    `User deleted: ${targetUserId} by ${adminUser.username}`
                )
            })
    }

    addCollaboratorToProject(
        adminUser: UserDefinition,
        projectId: string,
        userId: string,
        role: 'admin' | 'developer' | 'viewer'
    ): Promise<void> {
        const self = this

        return Promise.resolve()
            .then(function () {
                return self.canUserManageProject(adminUser, projectId)
            })
            .then(function (canManage) {
                if (!canManage) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                        'You do not have permission to manage this project'
                    )
                }

                if (!projectId || !userId || !role) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'Project ID, user ID, and role are required'
                    )
                }

                return self.dataStore.getUser(userId)
            })
            .then(function (user) {
                if (!user) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.NOT_FOUND,
                        'User not found'
                    )
                }

                return self.dataStore
                    .getProjectsDataStore()
                    .getProject(projectId)
            })
            .then(function (project) {
                if (!project) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.NOT_FOUND,
                        'Project not found'
                    )
                }

                if (!project.collaborators) {
                    project.collaborators = []
                }

                const existingCollaborator = project.collaborators.find(
                    (c: UserCollaborator) => c.userId === userId
                )

                if (existingCollaborator) {
                    existingCollaborator.role = role
                    existingCollaborator.addedAt = new Date().toISOString()
                    existingCollaborator.addedBy = adminUser.id
                } else {
                    const collaborator: UserCollaborator = {
                        userId: userId,
                        role: role,
                        addedAt: new Date().toISOString(),
                        addedBy: adminUser.id,
                    }
                    project.collaborators.push(collaborator)
                }

                return self.dataStore
                    .getProjectsDataStore()
                    .updateProject(project)
            })
            .then(function () {
                Logger.d(
                    `Collaborator added: ${userId} to project ${projectId} as ${role} by ${adminUser.username}`
                )
            })
    }

    removeCollaboratorFromProject(
        adminUser: UserDefinition,
        projectId: string,
        userId: string
    ): Promise<void> {
        const self = this

        return Promise.resolve()
            .then(function () {
                return self.canUserManageProject(adminUser, projectId)
            })
            .then(function (canManage) {
                if (!canManage) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.STATUS_ERROR_NOT_AUTHORIZED,
                        'You do not have permission to manage this project'
                    )
                }

                if (!projectId || !userId) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'Project ID and user ID are required'
                    )
                }

                return self.dataStore
                    .getProjectsDataStore()
                    .getProject(projectId)
            })
            .then(function (project) {
                if (!project) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.NOT_FOUND,
                        'Project not found'
                    )
                }

                if (!project.collaborators) {
                    project.collaborators = []
                }

                project.collaborators = project.collaborators.filter(
                    (c: UserCollaborator) => c.userId !== userId
                )

                return self.dataStore
                    .getProjectsDataStore()
                    .updateProject(project)
            })
            .then(function () {
                Logger.d(
                    `Collaborator removed: ${userId} from project ${projectId} by ${adminUser.username}`
                )
            })
    }

    getUserProjects(userId: string): Promise<ProjectDefinition[]> {
        const self = this

        return Promise.resolve()
            .then(function () {
                if (!userId) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.ILLEGAL_PARAMETER,
                        'User ID is required'
                    )
                }

                return self.dataStore.getUser(userId)
            })
            .then(function (user) {
                if (!user) {
                    throw ApiStatusCodes.createError(
                        ApiStatusCodes.NOT_FOUND,
                        'User not found'
                    )
                }

                if (user.role === UserRole.SUPER_ADMIN) {
                    return self.dataStore
                        .getProjectsDataStore()
                        .getAllProjects()
                }

                return self.dataStore
                    .getProjectsDataStore()
                    .getAllProjects()
                    .then(function (allProjects) {
                        return allProjects.filter(function (project) {
                            if (project.ownerId === userId) {
                                return true
                            }

                            if (
                                project.collaborators &&
                                project.collaborators.some(
                                    (c) => c.userId === userId
                                )
                            ) {
                                return true
                            }

                            return false
                        })
                    })
            })
    }

    canUserAccessProject(userId: string, projectId: string): Promise<boolean> {
        const self = this

        if (!userId || !projectId) {
            return Promise.resolve(false)
        }

        return Promise.resolve()
            .then(function () {
                return self.dataStore.getUser(userId)
            })
            .then(function (user) {
                if (!user) {
                    return false
                }

                if (user.role === UserRole.SUPER_ADMIN) {
                    return true
                }

                return self.dataStore
                    .getProjectsDataStore()
                    .getProject(projectId)
                    .then(function (project: ProjectDefinition) {
                        if (!project) {
                            return false
                        }

                        if (project.ownerId === userId) {
                            return true
                        }

                        if (
                            project.collaborators &&
                            project.collaborators.some(
                                (c: UserCollaborator) => c.userId === userId
                            )
                        ) {
                            return true
                        }

                        return false
                    })
            })
    }

    private canUserManageProject(
        user: UserDefinition,
        projectId: string
    ): Promise<boolean> {
        const self = this

        return Promise.resolve().then(function () {
            if (user.role === UserRole.SUPER_ADMIN) {
                return true
            }

            return self.dataStore
                .getProjectsDataStore()
                .getProject(projectId)
                .then(function (project) {
                    if (!project) {
                        return false
                    }

                    if (project.ownerId === user.id) {
                        return true
                    }

                    if (project.collaborators) {
                        const collaborator = project.collaborators.find(
                            (c) => c.userId === user.id
                        )
                        if (collaborator && collaborator.role === 'admin') {
                            return true
                        }
                    }

                    return false
                })
        })
    }

    private getDefaultPermissions(role: UserRole): UserPermissions {
        switch (role) {
            case UserRole.SUPER_ADMIN:
                return {
                    projects: [],
                    projectActions: {
                        canCreate: true,
                        canDelete: true,
                        canDeploy: true,
                    },
                    system: {
                        canManageUsers: true,
                        canManageSettings: true,
                        canViewLogs: true,
                        canManageDatabases: true,
                    },
                }
            case UserRole.ADMIN:
                return {
                    projects: [],
                    projectActions: {
                        canCreate: true,
                        canDelete: true,
                        canDeploy: true,
                    },
                    system: {
                        canManageUsers: false,
                        canManageSettings: false,
                        canViewLogs: true,
                        canManageDatabases: true,
                    },
                }
            case UserRole.DEVELOPER:
                return {
                    projects: [],
                    projectActions: {
                        canCreate: false,
                        canDelete: false,
                        canDeploy: true,
                    },
                    system: {
                        canManageUsers: false,
                        canManageSettings: false,
                        canViewLogs: true,
                        canManageDatabases: false,
                    },
                }
            case UserRole.VIEWER:
                return {
                    projects: [],
                    projectActions: {
                        canCreate: false,
                        canDelete: false,
                        canDeploy: false,
                    },
                    system: {
                        canManageUsers: false,
                        canManageSettings: false,
                        canViewLogs: true,
                        canManageDatabases: false,
                    },
                }
            default:
                return {
                    projects: [],
                    projectActions: {
                        canCreate: false,
                        canDelete: false,
                        canDeploy: false,
                    },
                    system: {
                        canManageUsers: false,
                        canManageSettings: false,
                        canViewLogs: false,
                        canManageDatabases: false,
                    },
                }
        }
    }
}
