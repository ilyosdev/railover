import ApiStatusCodes from '../api/ApiStatusCodes'
import DataStore from '../datastore/DataStore'
import { uploadCaptainDefinitionContent } from '../handlers/users/apps/appdata/AppDataHandler'
import { updateAppDefinition } from '../handlers/users/apps/appdefinition/AppDefinitionHandler'
import { IAppDef, IAppEnvVar, IAppVolume } from '../models/AppDefinition'
import { ServiceType } from '../models/ServiceType'
import Logger from '../utils/Logger'
import Utils from '../utils/Utils'
import ServiceManager from './ServiceManager'

export interface DatabaseTemplate {
    type: 'postgres' | 'mysql' | 'redis' | 'mongodb'
    version: string
    imageName: string
    defaultEnvVars: IAppEnvVar[]
    defaultPort: number
    volumePath: string
}

const DATABASE_TEMPLATES: Record<string, DatabaseTemplate> = {
    'postgres:16': {
        type: 'postgres',
        version: '16',
        imageName: 'postgres:16-alpine',
        defaultPort: 5432,
        volumePath: '/var/lib/postgresql/data',
        defaultEnvVars: [],
    },
    'postgres:15': {
        type: 'postgres',
        version: '15',
        imageName: 'postgres:15-alpine',
        defaultPort: 5432,
        volumePath: '/var/lib/postgresql/data',
        defaultEnvVars: [],
    },
    'mysql:8': {
        type: 'mysql',
        version: '8',
        imageName: 'mysql:8',
        defaultPort: 3306,
        volumePath: '/var/lib/mysql',
        defaultEnvVars: [],
    },
    'redis:7': {
        type: 'redis',
        version: '7',
        imageName: 'redis:7-alpine',
        defaultPort: 6379,
        volumePath: '/data',
        defaultEnvVars: [],
    },
    'mongodb:7': {
        type: 'mongodb',
        version: '7',
        imageName: 'mongo:7',
        defaultPort: 27017,
        volumePath: '/data/db',
        defaultEnvVars: [],
    },
}

class DatabaseTemplateManager {
    constructor(
        private dataStore: DataStore,
        private serviceManager?: ServiceManager
    ) {}

    getTemplate(dbType: string, version?: string): DatabaseTemplate {
        const key = version
            ? `${dbType}:${version}`
            : this.getLatestVersion(dbType)

        const template = DATABASE_TEMPLATES[key]

        if (!template) {
            throw ApiStatusCodes.createError(
                ApiStatusCodes.NOT_FOUND,
                `Database template not found for ${dbType}:${version || 'latest'}`
            )
        }

        return template
    }

    getLatestVersion(dbType: string): string {
        const versions = Object.keys(DATABASE_TEMPLATES).filter((key) =>
            key.startsWith(`${dbType}:`)
        )

        if (versions.length === 0) {
            throw ApiStatusCodes.createError(
                ApiStatusCodes.NOT_FOUND,
                `No templates found for database type: ${dbType}`
            )
        }

        return versions[0]
    }

    createDatabase(
        projectId: string,
        dbType: 'postgres' | 'mysql' | 'redis' | 'mongodb',
        serviceName: string,
        version?: string
    ) {
        const self = this
        const dataStore = this.dataStore
        let template: DatabaseTemplate
        let password: string
        let appName: string

        return Promise.resolve()
            .then(function () {
                Logger.d(
                    `Creating database: ${dbType}${version ? ':' + version : ''} for service: ${serviceName}`
                )

                template = self.getTemplate(dbType, version)
                password = Utils.generateRandomString(32)

                appName = serviceName.toLowerCase().trim()
                dataStore.getAppsDataStore().nameAllowedOrThrow(appName)
            })
            .then(function () {
                if (projectId) {
                    return dataStore
                        .getProjectsDataStore()
                        .getProject(projectId)
                }
            })
            .then(function () {
                const envVars = self.buildEnvVars(template, password)

                const volumes: IAppVolume[] = [
                    {
                        containerPath: template.volumePath,
                        volumeName: `${appName}-data`,
                    },
                ]
                const newApp: Partial<IAppDef> = {
                    appName: appName,
                    projectId: projectId || undefined,
                    description: `${template.type} ${template.version} database`,
                    hasPersistentData: true,
                    notExposeAsWebApp: true,
                    instanceCount: 1,
                    captainDefinitionRelativeFilePath: '',
                    envVars: envVars,
                    volumes: volumes,
                    ports: [],
                    networks: [],
                    customDomain: [],
                    versions: [],
                    deployedVersion: 0,
                    hasDefaultSubDomainSsl: false,
                    forceSsl: false,
                    websocketSupport: false,
                    serviceType: ServiceType.DATABASE,
                    displayName: serviceName,
                    tags: [
                        {
                            tagName: 'database',
                        },
                        {
                            tagName: template.type,
                        },
                    ],
                }

                return dataStore
                    .getAppsDataStore()
                    .registerAppDefinition(
                        appName,
                        projectId || undefined,
                        newApp.hasPersistentData!
                    )
            })
            .then(function () {
                if (!self.serviceManager) {
                    Logger.w(
                        'ServiceManager not provided, skipping configuration'
                    )
                    return dataStore
                        .getAppsDataStore()
                        .getAppDefinition(appName)
                }

                const envVars = self.buildEnvVars(template, password)
                const volumes: IAppVolume[] = [
                    {
                        containerPath: template.volumePath,
                        volumeName: `${appName}-data`,
                    },
                ]

                return updateAppDefinition(
                    {
                        appName: appName,
                        projectId: projectId || undefined,
                        description: `${template.type} ${template.version} database`,
                        envVars: envVars,
                        volumes: volumes,
                        notExposeAsWebApp: true,
                        containerHttpPort: template.defaultPort,
                        tags: [
                            { tagName: 'database' },
                            { tagName: template.type },
                        ],
                    },
                    self.serviceManager
                ).then(function () {
                    return dataStore
                        .getAppsDataStore()
                        .getAppDefinition(appName)
                })
            })
            .then(function (app) {
                if (!self.serviceManager) {
                    Logger.w('ServiceManager not provided, skipping deployment')
                    return app
                }

                Logger.d(
                    `Deploying database ${appName} with image ${template.imageName}`
                )

                const captainDefinitionContent = JSON.stringify({
                    schemaVersion: 2,
                    imageName: template.imageName,
                })

                // Wait for deployment to complete (not detached) so versions array is populated
                return uploadCaptainDefinitionContent(
                    {
                        appName: appName,
                        isDetachedBuild: false,
                        captainDefinitionContent: captainDefinitionContent,
                        gitHash: '',
                    },
                    self.serviceManager
                ).then(function () {
                    Logger.d(
                        `Database ${appName} deployment completed with image ${template.imageName}`
                    )
                    // Fetch fresh app definition with updated versions
                    return dataStore
                        .getAppsDataStore()
                        .getAppDefinition(appName)
                })
            })
    }

    private buildEnvVars(
        template: DatabaseTemplate,
        password: string
    ): IAppEnvVar[] {
        const envVars: IAppEnvVar[] = []

        switch (template.type) {
            case 'postgres':
                envVars.push({ key: 'POSTGRES_PASSWORD', value: password })
                envVars.push({ key: 'POSTGRES_USER', value: 'postgres' })
                envVars.push({ key: 'POSTGRES_DB', value: 'postgres' })
                break
            case 'mysql':
                envVars.push({ key: 'MYSQL_ROOT_PASSWORD', value: password })
                envVars.push({ key: 'MYSQL_DATABASE', value: 'mydb' })
                break
            case 'redis':
                envVars.push({ key: 'REDIS_PASSWORD', value: password })
                break
            case 'mongodb':
                envVars.push({
                    key: 'MONGO_INITDB_ROOT_USERNAME',
                    value: 'root',
                })
                envVars.push({
                    key: 'MONGO_INITDB_ROOT_PASSWORD',
                    value: password,
                })
                break
        }

        return envVars
    }

    getConnectionString(
        dbType: 'postgres' | 'mysql' | 'redis' | 'mongodb',
        serviceName: string,
        password: string,
        database?: string
    ): string {
        const template = this.getTemplate(dbType)

        switch (dbType) {
            case 'postgres':
                return `postgresql://postgres:${password}@srv-captain--${serviceName}:${template.defaultPort}/${database || 'postgres'}`
            case 'mysql':
                return `mysql://root:${password}@srv-captain--${serviceName}:${template.defaultPort}/${database || 'mydb'}`
            case 'redis':
                return `redis://:${password}@srv-captain--${serviceName}:${template.defaultPort}`
            case 'mongodb':
                return `mongodb://root:${password}@srv-captain--${serviceName}:${template.defaultPort}/${database || 'admin'}?authSource=admin`
            default:
                throw ApiStatusCodes.createError(
                    ApiStatusCodes.ILLEGAL_PARAMETER,
                    `Unknown database type: ${dbType}`
                )
        }
    }

    getConnectionEnvVars(
        dbType: 'postgres' | 'mysql' | 'redis' | 'mongodb',
        serviceName: string,
        password: string,
        database?: string
    ): IAppEnvVar[] {
        const template = this.getTemplate(dbType)
        const envVars: IAppEnvVar[] = []

        const connectionString = this.getConnectionString(
            dbType,
            serviceName,
            password,
            database
        )

        envVars.push({
            key: 'DATABASE_URL',
            value: connectionString,
        })

        envVars.push({
            key: 'DB_HOST',
            value: `srv-captain--${serviceName}`,
        })
        envVars.push({
            key: 'DB_PORT',
            value: String(template.defaultPort),
        })
        envVars.push({
            key: 'DB_PASSWORD',
            value: password,
        })

        switch (dbType) {
            case 'postgres':
                envVars.push({ key: 'DB_USER', value: 'postgres' })
                envVars.push({
                    key: 'DB_NAME',
                    value: database || 'postgres',
                })
                envVars.push({ key: 'PGUSER', value: 'postgres' })
                envVars.push({ key: 'PGPASSWORD', value: password })
                envVars.push({
                    key: 'PGDATABASE',
                    value: database || 'postgres',
                })
                envVars.push({
                    key: 'PGHOST',
                    value: `srv-captain--${serviceName}`,
                })
                envVars.push({
                    key: 'PGPORT',
                    value: String(template.defaultPort),
                })
                break
            case 'mysql':
                envVars.push({ key: 'DB_USER', value: 'root' })
                envVars.push({ key: 'DB_NAME', value: database || 'mydb' })
                break
            case 'mongodb':
                envVars.push({ key: 'DB_USER', value: 'root' })
                envVars.push({ key: 'DB_NAME', value: database || 'admin' })
                envVars.push({
                    key: 'MONGO_URL',
                    value: connectionString,
                })
                break
            case 'redis':
                envVars.push({
                    key: 'REDIS_URL',
                    value: connectionString,
                })
                break
        }

        return envVars
    }

    getAvailableTemplates(): DatabaseTemplate[] {
        return Object.values(DATABASE_TEMPLATES)
    }

    getDatabasePassword(appName: string) {
        const dataStore = this.dataStore

        return Promise.resolve()
            .then(function () {
                return dataStore.getAppsDataStore().getAppDefinition(appName)
            })
            .then(function (app) {
                const envVars = app.envVars || []

                const passwordKeys = [
                    'POSTGRES_PASSWORD',
                    'MYSQL_ROOT_PASSWORD',
                    'REDIS_PASSWORD',
                    'MONGO_INITDB_ROOT_PASSWORD',
                ]

                for (const key of passwordKeys) {
                    const envVar = envVars.find((v) => v.key === key)
                    if (envVar) {
                        return envVar.value
                    }
                }

                throw ApiStatusCodes.createError(
                    ApiStatusCodes.NOT_FOUND,
                    'Database password not found in app environment variables'
                )
            })
    }
}

export default DatabaseTemplateManager
