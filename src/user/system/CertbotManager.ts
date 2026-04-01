import Logger from '../../utils/Logger'

/**
 * CertbotManager — DISABLED.
 *
 * SSL is now handled entirely by Traefik + Cloudflare origin certificates.
 * Certbot / Let's Encrypt integration has been removed.
 *
 * This stub remains because other files (DomainResolveChecker,
 * SelfHostedDockerRegistry, BackupManager) import it. All methods
 * are no-ops that resolve immediately.
 */

class CertbotManager {
    constructor(..._args: any[]) {
        // No Docker API needed — certbot is not used
    }

    domainValidOrThrow(domainName: string) {
        if (!domainName) {
            throw new Error('Domain Name is empty')
        }

        const RegExpression = /^[a-z0-9\.\-]*$/

        if (!RegExpression.test(domainName)) {
            throw new Error('Bad Domain Name!')
        }
    }

    getCertRelativePathForDomain(domainName: string) {
        this.domainValidOrThrow(domainName)
        return `/live/${domainName}/fullchain.pem`
    }

    getKeyRelativePathForDomain(domainName: string) {
        this.domainValidOrThrow(domainName)
        return `/live/${domainName}/privkey.pem`
    }

    enableSsl(domainName: string): Promise<boolean> {
        Logger.d(
            `CertbotManager.enableSsl called for ${domainName} — no-op (Traefik + Cloudflare handle SSL)`
        )
        return Promise.resolve(true)
    }

    ensureRegistered(emailAddress: string): Promise<boolean> {
        Logger.d(
            'CertbotManager.ensureRegistered called — no-op (Traefik + Cloudflare handle SSL)'
        )
        return Promise.resolve(true)
    }

    renewAllCerts(): Promise<void> {
        Logger.d(
            'CertbotManager.renewAllCerts called — no-op (Traefik + Cloudflare handle SSL)'
        )
        return Promise.resolve()
    }

    init(myNodeId: string): Promise<boolean> {
        Logger.d(
            'CertbotManager.init called — no-op (certbot service removed)'
        )
        return Promise.resolve(true)
    }

    ensureAllCurrentlyRegisteredDomainsHaveDirs(): Promise<void> {
        return Promise.resolve()
    }

    lock() {
        // no-op — certbot removed
    }

    unlock() {
        // no-op — certbot removed
    }
}

export default CertbotManager

// Keep the export for BackupManager and other files that import it
export class CertCommandGenerator {
    constructor(..._args: any[]) {}
    getCertbotCertCommand(domainName: string, webroot: string): string[] {
        return []
    }
}
