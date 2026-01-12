import DataStore from '../datastore/DataStore'
import { IAppDef, IAppEnvVar } from '../models/AppDefinition'
import Logger from '../utils/Logger'

/**
 * Reference Variable Syntax: ${{serviceName.VAR_NAME}}
 * Examples:
 *   ${{postgres.DATABASE_URL}}
 *   ${{shared.API_KEY}}           - Project-level shared variable
 *   ${{backend-api.PORT}}
 */

const REFERENCE_PATTERN = /\$\{\{([^}]+)\}\}/g
const SINGLE_REFERENCE_PATTERN = /^\$\{\{([^}]+)\}\}$/

export interface VariableReference {
    serviceName: string
    variableName: string
    fullRef: string // ${{service.VAR}}
}

export interface AvailableReference {
    serviceName: string
    displayName: string
    serviceType: string
    variables: {
        key: string
        preview: string // First 20 chars or masked
        isSecret: boolean
    }[]
}

export interface ResolvedVariable extends IAppEnvVar {
    originalValue?: string // The ${{}} reference
    isReference: boolean
    resolvedFrom?: string // Service name it was resolved from
}

class ReferenceVariableResolver {
    constructor(private dataStore: DataStore) {}

    /**
     * Parse a reference string like ${{postgres.DATABASE_URL}}
     */
    parseReference(value: string): VariableReference | null {
        const match = value.match(SINGLE_REFERENCE_PATTERN)
        if (!match) return null

        const refContent = match[1]
        const dotIndex = refContent.indexOf('.')

        if (dotIndex === -1) return null

        return {
            serviceName: refContent.substring(0, dotIndex),
            variableName: refContent.substring(dotIndex + 1),
            fullRef: value,
        }
    }

    /**
     * Find all references in a value string
     */
    findReferences(value: string): VariableReference[] {
        const references: VariableReference[] = []
        let match

        while ((match = REFERENCE_PATTERN.exec(value)) !== null) {
            const refContent = match[1]
            const dotIndex = refContent.indexOf('.')

            if (dotIndex !== -1) {
                references.push({
                    serviceName: refContent.substring(0, dotIndex),
                    variableName: refContent.substring(dotIndex + 1),
                    fullRef: match[0],
                })
            }
        }

        return references
    }

    /**
     * Check if a value contains any references
     */
    containsReference(value: string): boolean {
        return REFERENCE_PATTERN.test(value)
    }

    /**
     * Resolve all references in environment variables for a service
     */
    resolveVariables(
        serviceEnvVars: IAppEnvVar[],
        projectServices: IAppDef[],
        projectSharedVars: IAppEnvVar[] = []
    ): ResolvedVariable[] {
        const self = this

        // Build lookup map: serviceName -> { varName -> value }
        const serviceVarMap = new Map<string, Map<string, string>>()

        // Add shared project variables
        const sharedMap = new Map<string, string>()
        projectSharedVars.forEach((v) => sharedMap.set(v.key, v.value))
        serviceVarMap.set('shared', sharedMap)

        // Add each service's variables
        projectServices.forEach((service) => {
            const varMap = new Map<string, string>()
            const envVars = service.envVars || []
            envVars.forEach((v) => varMap.set(v.key, v.value))
            serviceVarMap.set(service.appName || '', varMap)
        })

        // Resolve each variable
        return serviceEnvVars.map((envVar) => {
            const resolved: ResolvedVariable = {
                key: envVar.key,
                value: envVar.value,
                isReference: false,
            }

            if (!self.containsReference(envVar.value)) {
                return resolved
            }

            resolved.originalValue = envVar.value
            resolved.isReference = true

            // Resolve all references in the value
            let resolvedValue = envVar.value
            const references = self.findReferences(envVar.value)

            for (const ref of references) {
                const serviceVars = serviceVarMap.get(ref.serviceName)
                if (!serviceVars) {
                    Logger.w(
                        `Reference resolution failed: service "${ref.serviceName}" not found`
                    )
                    continue
                }

                const targetValue = serviceVars.get(ref.variableName)
                if (targetValue === undefined) {
                    Logger.w(
                        `Reference resolution failed: variable "${ref.variableName}" not found in service "${ref.serviceName}"`
                    )
                    continue
                }

                resolvedValue = resolvedValue.replace(ref.fullRef, targetValue)
                resolved.resolvedFrom = ref.serviceName
            }

            resolved.value = resolvedValue
            return resolved
        })
    }

    /**
     * Get available references for autocomplete in a project
     */
    getAvailableReferences(projectId: string) {
        const self = this
        const dataStore = this.dataStore

        let projectSharedVars: IAppEnvVar[] = []

        return Promise.resolve()
            .then(function () {
                return dataStore.getProjectsDataStore().getProject(projectId)
            })
            .then(function (project) {
                projectSharedVars = project.sharedEnvVars || []
                return dataStore.getAppsDataStore().getAppDefinitions()
            })
            .then(function (allApps) {
                const appsList = Object.keys(allApps).map((key) => ({
                    ...allApps[key],
                    appName: key,
                }))

                const projectServices = appsList.filter(
                    (app) => app.projectId === projectId
                )

                const references: AvailableReference[] = []

                // Add shared project variables
                if (projectSharedVars.length > 0) {
                    references.push({
                        serviceName: 'shared',
                        displayName: 'Shared Variables',
                        serviceType: 'shared',
                        variables: projectSharedVars.map((v) => ({
                            key: v.key,
                            preview: self.getPreview(v.key, v.value),
                            isSecret: self.isSecretVariable(v.key),
                        })),
                    })
                }

                // Add each service's variables
                projectServices.forEach((service) => {
                    const envVars = service.envVars || []
                    if (envVars.length === 0) return

                    references.push({
                        serviceName: service.appName || '',
                        displayName:
                            service.displayName || service.appName || '',
                        serviceType: service.serviceType || 'backend',
                        variables: envVars.map((v) => ({
                            key: v.key,
                            preview: self.getPreview(v.key, v.value),
                            isSecret: self.isSecretVariable(v.key),
                        })),
                    })
                })

                return references
            })
    }

    /**
     * Validate a reference string
     */
    validateReference(
        reference: string,
        projectServices: IAppDef[],
        projectSharedVars: IAppEnvVar[] = []
    ): { valid: boolean; error?: string } {
        const parsed = this.parseReference(reference)

        if (!parsed) {
            return {
                valid: false,
                error: 'Invalid reference format. Use ${{serviceName.VAR_NAME}}',
            }
        }

        // Check for shared variables
        if (parsed.serviceName === 'shared') {
            const found = projectSharedVars.find(
                (v) => v.key === parsed.variableName
            )
            if (!found) {
                return {
                    valid: false,
                    error: `Shared variable "${parsed.variableName}" not found`,
                }
            }
            return { valid: true }
        }

        // Check for service variables
        const targetService = projectServices.find(
            (s) => s.appName === parsed.serviceName
        )

        if (!targetService) {
            return {
                valid: false,
                error: `Service "${parsed.serviceName}" not found in project`,
            }
        }

        const envVars = targetService.envVars || []
        const targetVar = envVars.find((v) => v.key === parsed.variableName)

        if (!targetVar) {
            return {
                valid: false,
                error: `Variable "${parsed.variableName}" not found in service "${parsed.serviceName}"`,
            }
        }

        return { valid: true }
    }

    /**
     * Get a preview of a variable value (masked if secret)
     */
    private getPreview(key: string, value: string): string {
        if (this.isSecretVariable(key)) {
            return '********'
        }

        if (value.length > 30) {
            return value.substring(0, 30) + '...'
        }

        return value
    }

    /**
     * Check if a variable is likely a secret based on its name
     */
    private isSecretVariable(key: string): boolean {
        const secretPatterns = [
            'password',
            'secret',
            'key',
            'token',
            'api_key',
            'apikey',
            'private',
            'credential',
            'auth',
        ]

        const lowerKey = key.toLowerCase()
        return secretPatterns.some((pattern) => lowerKey.includes(pattern))
    }
}

export default ReferenceVariableResolver
