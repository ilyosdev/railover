export const enum ServiceType {
    FRONTEND = 'frontend',
    BACKEND = 'backend',
    DATABASE = 'database',
    WORKER = 'worker',
    CRON = 'cron',
}

export interface ServiceTypeMetadata {
    type: ServiceType
    icon: string
    color: string
    defaultPort?: number
    isStateful: boolean
}

export const SERVICE_TYPE_METADATA: Record<ServiceType, ServiceTypeMetadata> = {
    [ServiceType.FRONTEND]: {
        type: ServiceType.FRONTEND,
        icon: '🌐',
        color: '#8b5cf6',
        defaultPort: 80,
        isStateful: false,
    },
    [ServiceType.BACKEND]: {
        type: ServiceType.BACKEND,
        icon: '⚙️',
        color: '#3b82f6',
        defaultPort: 3000,
        isStateful: false,
    },
    [ServiceType.DATABASE]: {
        type: ServiceType.DATABASE,
        icon: '🗄️',
        color: '#10b981',
        isStateful: true,
    },
    [ServiceType.WORKER]: {
        type: ServiceType.WORKER,
        icon: '⚡',
        color: '#f59e0b',
        isStateful: false,
    },
    [ServiceType.CRON]: {
        type: ServiceType.CRON,
        icon: '⏰',
        color: '#ef4444',
        isStateful: false,
    },
}
