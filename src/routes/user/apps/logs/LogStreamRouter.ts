import express = require('express')
import DockerApi from '../../../../docker/DockerApi'
import Logger from '../../../../utils/Logger'
import CaptainConstants from '../../../../utils/CaptainConstants'
import Authenticator from '../../../../user/Authenticator'

const router = express.Router()

let io: any = null
let httpServer: any = null

function initializeSocketIO() {
    if (io) return { io, httpServer }

    try {
        const socketIO = require('socket.io')
        const { createServer } = require('http')

        httpServer = createServer()
        io = new socketIO.Server(httpServer, {
            cors: {
                origin: '*',
                methods: ['GET', 'POST'],
            },
            path: '/logs-socket',
            transports: ['websocket', 'polling'],
        })

        setupSocketHandlers()

        return { io, httpServer }
    } catch (error) {
        Logger.e(`Failed to initialize Socket.IO: ${error}`)
        throw error
    }
}

interface LogSubscription {
    appName: string
    namespace: string
    logStream: any
}

const activeSubscriptions = new Map<string, LogSubscription>()

function setupSocketHandlers() {
    if (!io) return

    io.on('connection', (socket: any) => {
        const socketId = socket.id
        Logger.d(`WebSocket client connected: ${socketId}`)

        socket.on('subscribe', async (data: any) => {
            const { appName, token } = data

            Logger.d(`Subscription request: ${socketId} -> ${appName}`)

            try {
                const user = await verifyToken(token)
                if (!user) {
                    Logger.w(`Unauthorized subscription attempt: ${socketId}`)
                    socket.emit('error', { message: 'Not authenticated' })
                    socket.disconnect()
                    return
                }

                const namespace = user.namespace

                const canAccess = await canUserAccessApp(namespace, appName)
                if (!canAccess) {
                    Logger.w(`Unauthorized access: ${namespace} -> ${appName}`)
                    socket.emit('error', { message: 'Access denied' })
                    return
                }

                if (activeSubscriptions.has(socketId)) {
                    const existing = activeSubscriptions.get(socketId)
                    if (existing && existing.logStream) {
                        existing.logStream.destroy()
                    }
                }

                Logger.d(`Subscribed: ${socketId} -> ${appName}`)

                const logStream = await streamLogs(socket, appName, namespace)

                activeSubscriptions.set(socketId, {
                    appName,
                    namespace,
                    logStream,
                })

                socket.emit('subscribed', {
                    appName,
                    message: 'Subscribed to logs',
                })
            } catch (error: any) {
                Logger.e(`Error during subscription: ${error}`)
                socket.emit('error', {
                    message: `Failed to subscribe: ${error.message}`,
                })
            }
        })

        socket.on('unsubscribe', (data: any) => {
            Logger.d(`Unsubscribe request: ${socketId}`)

            if (activeSubscriptions.has(socketId)) {
                const subscription = activeSubscriptions.get(socketId)
                if (subscription && subscription.logStream) {
                    subscription.logStream.destroy()
                }
                activeSubscriptions.delete(socketId)
                Logger.d(`Unsubscribed: ${socketId}`)
            }
        })

        socket.on('disconnect', () => {
            Logger.d(`WebSocket client disconnected: ${socketId}`)

            if (activeSubscriptions.has(socketId)) {
                const subscription = activeSubscriptions.get(socketId)
                if (subscription && subscription.logStream) {
                    subscription.logStream.destroy()
                }
                activeSubscriptions.delete(socketId)
            }
        })
    })
}

async function streamLogs(
    socket: any,
    appName: string,
    namespace: string
): Promise<any> {
    const dockerApi = DockerApi.get()
    const serviceName = `srv-${CaptainConstants.rootNameSpace}-${appName}`

    try {
        const service = (dockerApi as any).dockerode.getService(serviceName)

        await service.inspect()

        const logStream = await service.logs({
            stdout: true,
            stderr: true,
            follow: true,
            tail: 100,
            timestamps: !!CaptainConstants.configs.enableDockerLogsTimestamp,
        })

        logStream.on('data', (chunk: Buffer) => {
            try {
                let offset = 0
                while (offset < chunk.length) {
                    if (chunk.length - offset < 8) break

                    const header = chunk.slice(offset, offset + 8)
                    const streamType = header[0]
                    const size =
                        (header[4] << 24) |
                        (header[5] << 16) |
                        (header[6] << 8) |
                        header[7]

                    if (offset + 8 + size > chunk.length) break

                    const payload = chunk.slice(offset + 8, offset + 8 + size)
                    const logLine = payload.toString('utf8')

                    socket.emit('log', {
                        appName,
                        line: logLine,
                        timestamp: Date.now(),
                        stream: streamType === 1 ? 'stdout' : 'stderr',
                    })

                    offset += 8 + size
                }
            } catch (error) {
                Logger.e(`Error parsing log chunk: ${error}`)
            }
        })

        logStream.on('error', (error: Error) => {
            Logger.e(`Log stream error: ${error}`)
            socket.emit('error', {
                message: `Log stream error: ${error.message}`,
            })
        })

        logStream.on('end', () => {
            Logger.d(`Log stream ended for ${appName}`)
            socket.emit('stream-ended', { appName })
        })

        return logStream
    } catch (error) {
        Logger.e(`Error starting log stream for ${appName}: ${error}`)
        throw error
    }
}

async function verifyToken(token: string): Promise<any> {
    if (!token) {
        return null
    }

    try {
        let namespace = CaptainConstants.rootNameSpace
        let actualToken = token

        if (token.includes(':')) {
            const parts = token.split(':')
            namespace = parts[0]
            actualToken = parts[1]
        }

        const authenticator = Authenticator.getAuthenticator(namespace)
        const decoded = await authenticator.decodeAuthToken(actualToken)

        if (!decoded) {
            return null
        }

        return {
            namespace: decoded.namespace,
            tokenVersion: decoded.tokenVersion,
        }
    } catch (error) {
        Logger.e(`Token verification failed: ${error}`)
        return null
    }
}

async function canUserAccessApp(
    namespace: string,
    appName: string
): Promise<boolean> {
    try {
        if (!namespace || !appName) {
            return false
        }

        return true
    } catch (error) {
        Logger.e(`Error checking app access: ${error}`)
        return false
    }
}

router.get('/connection-info', function (req, res, next) {
    res.send({
        socketPath: '/logs-socket',
        port: CaptainConstants.configs.adminPortNumber3000,
        transports: ['websocket', 'polling'],
    })
})

export default router
export { initializeSocketIO, httpServer, io }
