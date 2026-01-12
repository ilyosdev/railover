import AppDataRouter from './appdata/AppDataRouter'
import AppDefinitionRouter from './appdefinition/AppDefinitionRouter'
import WebhooksRouter from './webhooks/WebhooksRouter'
import LogStreamRouter from './logs/LogStreamRouter'

import express = require('express')

const router = express.Router()

router.use('/appDefinitions/', AppDefinitionRouter)

router.use('/appData/', AppDataRouter)

router.use('/logs/', LogStreamRouter)

router.use('/webhooks/', WebhooksRouter)

export default router
