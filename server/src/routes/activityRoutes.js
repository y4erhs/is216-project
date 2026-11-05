const express = require('express')
const activityController = require('../controllers/activityController')

const { requireAuth, selfParam } = require('../middleware/authCheck')

const router = express.Router()

router.get('/:id', requireAuth, selfParam('id'), activityController.getActivities)
router.put('/:id/:eventId', requireAuth, selfParam('id'), activityController.upsertActivity)
router.delete('/:id/:eventId', requireAuth, selfParam('id'), activityController.deleteActivity)

module.exports = router