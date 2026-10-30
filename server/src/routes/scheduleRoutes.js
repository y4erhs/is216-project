const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');

router.get('/conflicts', scheduleController.getConflicts);

module.exports = router;