const express = require('express');

const recommendationController = require('../controllers/recommendationController');

const { requireAuth, selfParam, selfField } = require('../middleware/authCheck');

const router = express.Router();

router.use(requireAuth);

router.get('/user/:id', selfParam('id'), recommendationController.getRecommendationsByUser);
router.post('/generate', selfField('body', 'userId'), recommendationController.generateRecommendations);
router.put('/:id/less-like', selfField('body', 'userId'), recommendationController.lessLikeThis);

module.exports = router