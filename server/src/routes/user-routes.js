const express = require('express');

const userController = require('../controllers/userController');

const router = express.Router();

//api routing
router.get('/preferences', userController.getPreferences);

module.exports = router