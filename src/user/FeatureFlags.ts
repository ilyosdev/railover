import DataStore from '../datastore/DataStore'
import Logger from '../utils/Logger'

/**
 * FeatureFlags — stubbed for AppX.
 * No external API calls to caprover.com.
 */
export default class FeatureFlags {
    static instance: FeatureFlags

    static IS_PRO_ENABLED = 'isProEnabled'

    static get(datastore: DataStore) {
        if (!FeatureFlags.instance) {
            FeatureFlags.instance = new FeatureFlags()
        }
        return FeatureFlags.instance
    }

    private featureFlags: any | undefined

    private constructor() {
        this.featureFlags = {
            [FeatureFlags.IS_PRO_ENABLED]: false,
        }
        Logger.d('FeatureFlags initialized (AppX local mode)')
    }

    getFeatureFlags(): any | undefined {
        return this.featureFlags
    }
}
