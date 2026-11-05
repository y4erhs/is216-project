const express = require('express')
const router = express.Router()
const googleController = require('../controllers/googleController')
const { requireAuth, selfField } = require('../middleware/authCheck')

const mine = [requireAuth, selfField('query', 'userId')]

router.get('/', mine, googleController.connect)
router.get('/callback', googleController.callback)
router.get('/status', mine, googleController.status)
router.get('/signin', googleController.signInStart)
router.get('/signin/callback', googleController.signInCallback)
router.post('/signin/exchange', googleController.signInExchange)
router.get('/signin/signup-info', googleController.signInSignupInfo)
router.delete('/', mine, googleController.disconnect)
router.patch('/settings', mine, googleController.updateSettings)

module.exports = router