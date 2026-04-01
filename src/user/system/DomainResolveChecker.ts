import { v4 as uuid } from 'uuid'
import ApiStatusCodes from '../../api/ApiStatusCodes'
import CaptainConstants from '../../utils/CaptainConstants'
import Logger from '../../utils/Logger'
import Utils from '../../utils/Utils'
import LoadBalancerManager from './LoadBalancerManager'
import request = require('request')
import fs = require('fs-extra')

/**
 * DomainResolveChecker — Traefik-only version.
 *
 * SSL certificate requests via certbot have been removed.
 * Traefik + Cloudflare handle SSL automatically.
 * Domain verification still works by writing a file and checking
 * it is reachable via HTTP (Traefik routes the request).
 */
export default class DomainResolveChecker {
    constructor(
        private loadBalancerManager: LoadBalancerManager,
        private certbotManager: any // kept for interface compat, unused
    ) {}

    requestCertificateForDomain(domainName: string) {
        // SSL is handled by Traefik + Cloudflare — no certbot needed
        Logger.d(
            `requestCertificateForDomain called for ${domainName} — no-op (Traefik + Cloudflare handle SSL)`
        )
        return Promise.resolve(true)
    }

    /**
     * Returns a promise successfully if verification is succeeded. If it fails, it throws an exception.
     *
     * @param domainName the domain to verify, app.mycaptainroot.com or www.myawesomeapp.com
     * @param identifierSuffix an optional suffix to be added to the identifier file name to avoid name conflict
     *
     * @returns {Promise.<boolean>}
     */
    verifyCaptainOwnsDomainOrThrow(
        domainName: string,
        identifierSuffix: string | undefined
    ) {
        if (CaptainConstants.configs.skipVerifyingDomains) {
            return Utils.getDelayedPromise(1000)
        }

        const self = this
        const randomUuid = uuid()
        const captainConfirmationPath =
            CaptainConstants.captainConfirmationPath +
            (identifierSuffix ? identifierSuffix : '')

        return Promise.resolve()
            .then(function () {
                if (self.certbotManager && self.certbotManager.domainValidOrThrow) {
                    return self.certbotManager.domainValidOrThrow(domainName)
                }
            })
            .then(function () {
                return fs.outputFile(
                    `${
                        CaptainConstants.captainStaticFilesDir +
                        CaptainConstants.nginxDomainSpecificHtmlDir
                    }/${domainName}${captainConfirmationPath}`,
                    randomUuid
                )
            })
            .then(function () {
                return new Promise<void>(function (resolve) {
                    setTimeout(function () {
                        resolve()
                    }, 1000)
                })
            })
            .then(function () {
                return new Promise<void>(function (resolve, reject) {
                    const url = `http://${domainName}:${CaptainConstants.configs.nginxPortNumber80}${captainConfirmationPath}`

                    request(
                        url,

                        function (error, response, body) {
                            if (error || !body || body !== randomUuid) {
                                Logger.e(
                                    `Verification Failed for ${domainName}`
                                )
                                Logger.e(`Error        ${error}`)
                                Logger.e(`body         ${body}`)
                                Logger.e(`randomUuid   ${randomUuid}`)
                                reject(
                                    ApiStatusCodes.createError(
                                        ApiStatusCodes.VERIFICATION_FAILED,
                                        'Verification Failed.'
                                    )
                                )
                                return
                            }

                            resolve()
                        }
                    )
                })
            })
    }

    verifyDomainResolvesToDefaultServerOnHost(domainName: string) {
        if (CaptainConstants.configs.skipVerifyingDomains) {
            return Utils.getDelayedPromise(1000)
        }

        const self = this

        return new Promise<void>(function (resolve, reject) {
            const url = `http://${domainName}${CaptainConstants.captainConfirmationPath}`

            Logger.d(`Sending request to ${url}`)

            request(url, function (error, response, body) {
                if (
                    error ||
                    !body ||
                    body !==
                        self.loadBalancerManager.getCaptainPublicRandomKey()
                ) {
                    reject(
                        ApiStatusCodes.createError(
                            ApiStatusCodes.VERIFICATION_FAILED,
                            'Verification Failed.'
                        )
                    )
                    return
                }

                resolve()
            })
        })
    }
}
