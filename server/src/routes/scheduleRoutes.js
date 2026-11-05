const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { requireAuth, selfField } = require('../middleware/authCheck');

router.get('/conflicts', requireAuth, selfField('query', 'userId'), scheduleController.getConflicts);

module.exports = router;