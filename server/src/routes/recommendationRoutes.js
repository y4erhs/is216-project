const express = require('express');

const recommendationController = require('../controllers/recommendationController');

const router = express.Router();

router.get('/user/:id', recommendationController.getRecommendationsByUser);
router.post('/generate', recommendationController.generateRecommendations);

module.exports = router