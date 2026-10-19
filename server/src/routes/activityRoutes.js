const express = require('express')
const activityController = require('../controllers/activityController')

const router = express.Router()

router.get('/:id', activityController.getActivities)
router.put('/:id/:eventId', activityController.upsertActivity)
router.delete('/:id/:eventId', activityController.deleteActivity)

module.exports = router