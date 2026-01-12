import express = require('express')
import { v4 as uuid } from 'uuid'
import ApiStatusCodes from '../../api/ApiStatusCodes'
import BaseApi from '../../api/BaseApi'
import DataStoreProvider from '../../datastore/DataStoreProvider'
import InjectionExtractor from '../../injection/InjectionExtractor'
import { UserRole } from '../../models/UserDefinition'
import Authenticator from '../../user/Authenticator'
import {
    CapRoverEventFactory,
    CapRoverEventType,
} from '../../user/events/ICapRoverEvent'
import CaptainConstants from '../../utils/CaptainConstants'
import CircularQueue from '../../utils/CircularQueue'

const router = express.Router()

const failedLoginCircularTimestamps = new CircularQueue<number>(5)

router.post('/', function (req, res, next) {
    const password = `${req.body.password || ''}`
    const otpToken = `${req.body.otpToken || ''}`
    const username = `${req.body.username || ''}`

    if (!password) {
        const response = new BaseApi(
            ApiStatusCodes.STATUS_ERROR_GENERIC,
            'password is empty.'
        )
        res.send(response)
        return
    }

    if (password.length > 29) {
        const response = new BaseApi(
            ApiStatusCodes.STATUS_ERROR_GENERIC,
            'password is too long - maximum 29 characters. If you had previously set a password longer than 29 characters, please use the first 29 characters.'
        )
        res.send(response)
        return
    }

    let authToken: string
    let loginUsername = username

    const namespace =
        InjectionExtractor.extractGlobalsFromInjected(res).namespace
    const userManagerForLoginOnly =
        InjectionExtractor.extractGlobalsFromInjected(
            res
        ).userManagerForLoginOnly
    const otpAuthenticatorForLoginOnly =
        userManagerForLoginOnly.otpAuthenticator
    const eventLoggerForLoginOnly = userManagerForLoginOnly.eventLogger
    const dataStore = DataStoreProvider.getDataStore(namespace)

    let loadedHashedPassword = ''

    Promise.resolve()
        .then(function () {
            return otpAuthenticatorForLoginOnly.is2FactorEnabled()
        })
        .then(function (isEnabled) {
            if (isEnabled && !otpToken) {
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_ERROR_OTP_REQUIRED,
                    'Enter OTP token as well'
                )
            }
        })
        .then(function () {
            const oldestKnownFailedLogin = failedLoginCircularTimestamps.peek()
            if (
                oldestKnownFailedLogin &&
                new Date().getTime() - oldestKnownFailedLogin < 30000
            )
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.STATUS_PASSWORD_BACK_OFF,
                    'Too many wrong passwords... Wait for 30 seconds and retry.'
                )

            if (username) {
                return dataStore
                    .getUserByUsername(username)
                    .then(function (user) {
                        if (!user) {
                            throw ApiStatusCodes.createError(
                                ApiStatusCodes.STATUS_WRONG_PASSWORD,
                                'Invalid credentials'
                            )
                        }
                        loginUsername = user.username
                        return user.passwordHash
                    })
            }

            loginUsername = 'admin'
            return dataStore
                .getUserByUsername('admin')
                .then(function (existingAdmin) {
                    if (!existingAdmin) {
                        return dataStore
                            .getHashedPassword()
                            .then(function (hashedPwd) {
                                const adminUser = {
                                    id: uuid(),
                                    username: 'admin',
                                    email: 'admin@localhost',
                                    passwordHash: hashedPwd,
                                    role: UserRole.SUPER_ADMIN,
                                    permissions: {
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
                                    },
                                    createdAt: new Date().toISOString(),
                                }
                                return dataStore
                                    .saveUser(adminUser)
                                    .then(function () {
                                        return hashedPwd
                                    })
                            })
                    }
                    return existingAdmin.passwordHash
                })
        })
        .then(function (savedHashedPassword) {
            loadedHashedPassword = savedHashedPassword
            return Authenticator.getAuthenticator(namespace).getAuthToken(
                { otpToken, otpAuthenticator: otpAuthenticatorForLoginOnly },
                password,
                loadedHashedPassword,
                undefined,
                loginUsername
            )
        })
        .then(function (token) {
            authToken = token
            return Authenticator.getAuthenticator(
                namespace
            ).getAuthTokenForCookies(
                { otpToken, otpAuthenticator: otpAuthenticatorForLoginOnly },
                password,
                loadedHashedPassword,
                loginUsername
            )
        })
        .then(function (cookieAuth) {
            res.cookie(CaptainConstants.headerCookieAuth, cookieAuth)
            const baseApi = new BaseApi(
                ApiStatusCodes.STATUS_OK,
                'Login succeeded'
            )
            baseApi.data = { token: authToken }
            eventLoggerForLoginOnly.trackEvent(
                CapRoverEventFactory.create(CapRoverEventType.UserLoggedIn, {
                    ip: req.headers['x-real-ip'] || 'unknown',
                })
            )
            res.send(baseApi)
        })
        .catch(function (err) {
            return new Promise(function (resolve, reject) {
                if (
                    err &&
                    err.captainErrorType &&
                    err.captainErrorType ===
                        ApiStatusCodes.STATUS_WRONG_PASSWORD
                ) {
                    failedLoginCircularTimestamps.push(new Date().getTime())
                }
                reject(err)
            })
        })
        .catch(ApiStatusCodes.createCatcher(res))
})

export default router
