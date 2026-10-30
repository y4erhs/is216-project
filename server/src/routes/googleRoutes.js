const express = require('express')
const router = express.Router()
const googleController = require('../controllers/googleController')

router.get('/', googleController.connect)
router.get('/callback', googleController.callback)
router.get('/status', googleController.status)
router.delete('/', googleController.disconnect)
router.patch('/settings', googleController.updateSettings)

module.exports = router