const express = require('express')
const router = express.Router()
const googleController = require('../controllers/googleController')

router.get('/', googleController.connect)
router.get('/callback', googleController.callback)
router.get('/status', googleController.status)
router.get('/signin', googleController.signInStart)
router.get('/signin/callback', googleController.signInCallback)
router.post('/signin/exchange', googleController.signInExchange)
router.get('/signin/signup-info', googleController.signInSignupInfo)
router.delete('/', googleController.disconnect)
router.patch('/settings', googleController.updateSettings)

module.exports = router