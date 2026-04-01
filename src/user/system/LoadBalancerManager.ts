import { v4 as uuid } from 'uuid'
import DataStore from '../../datastore/DataStore'
import DockerApi from '../../docker/DockerApi'
import CaptainConstants from '../../utils/CaptainConstants'
import Logger from '../../utils/Logger'
import LoadBalancerInfo from '../../models/LoadBalancerInfo'
import fs = require('fs-extra')

/**
 * LoadBalancerManager — Traefik-only version.
 *
 * Nginx has been fully removed. Traefik handles all routing and SSL
 * via Docker labels (added by addTraefikLabels() in the backend).
 * Cloudflare handles SSL termination + origin certs.
 *
 * This class retains its public interface so callers (ServiceManager,
 * CaptainManager, SelfHostedDockerRegistry) don't break, but every
 * method that previously generated nginx config or touched certbot
 * is now a no-op that resolves immediately.
 */

class LoadBalancerManager {
    private captainPublicRandomKey: string

    constructor(
        private dockerApi: DockerApi,
        private dataStore: DataStore
    ) {
        this.captainPublicRandomKey = uuid()
        // Reference to suppress noUnusedLocals — kept for future use
        void this.dockerApi
        void this.dataStore
    }

    /**
     * Previously regenerated the nginx config file and reloaded nginx.
     * Now a no-op — Traefik picks up routing changes automatically
     * via Docker label changes on services.
     */
    rePopulateNginxConfigFile(): Promise<void> {
        Logger.d(
            'LoadBalancerManager.rePopulateNginxConfigFile called — no-op (Traefik handles routing via Docker labels)'
        )
        return Promise.resolve()
    }

    getCaptainPublicRandomKey() {
        return this.captainPublicRandomKey
    }

    /**
     * Previously returned nginx stub_status metrics.
     * Now returns zeroed-out LoadBalancerInfo since Traefik exposes
     * its own metrics via /api/dashboard.
     */
    getInfo(): Promise<LoadBalancerInfo> {
        const data = new LoadBalancerInfo()
        data.activeConnections = 0
        data.accepted = 0
        data.handled = 0
        data.total = 0
        data.reading = 0
        data.writing = 0
        data.waiting = 0
        return Promise.resolve(data)
    }

    getLogPath(appName: string, domainName: string) {
        return `${CaptainConstants.nginxSharedLogsPath}/${this.getLogName(appName, domainName)}`
    }

    getLogName(appName: string, domainName: string) {
        return `${appName}--${domainName}--access.log`
    }

    parseLogPath(logPath: string): { domainName: string; fileName: string } {
        const splitName = logPath.split('--')
        const fileName =
            splitName.length > 3
                ? `${splitName[3].replace('.html', '')}`
                : logPath

        return {
            domainName: splitName[1],
            fileName,
        }
    }

    /**
     * Initialize the load balancer. Previously this created and configured
     * the captain-nginx Docker service and initialized certbot.
     * Now it only writes the captain confirmation file (used by health checks)
     * and ensures required directories exist.
     */
    init(myNodeId: string, dataStore: DataStore) {
        const self = this

        return fs
            .outputFile(
                CaptainConstants.captainStaticFilesDir +
                    CaptainConstants.nginxDefaultHtmlDir +
                    CaptainConstants.captainConfirmationPath,
                self.getCaptainPublicRandomKey()
            )
            .then(function () {
                return fs.outputFile(
                    CaptainConstants.captainStaticFilesDir +
                        CaptainConstants.nginxDefaultHtmlDir +
                        '/index.html',
                    '<html><body><h1>Railover is running</h1><p>Routing handled by Traefik.</p></body></html>'
                )
            })
            .then(function () {
                return fs.ensureDir(CaptainConstants.letsEncryptEtcPath)
            })
            .then(function () {
                Logger.d(
                    'LoadBalancerManager initialized (Traefik mode — no nginx, no certbot)'
                )
            })
    }
}

export default LoadBalancerManager
