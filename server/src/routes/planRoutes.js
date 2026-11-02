const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');

router.get('/', planController.listPlans);
router.post('/', planController.createPlan);
router.post('/sync', planController.syncPlans);
router.put('/:id', planController.updatePlan);
router.delete('/:id', planController.deletePlan);
router.put('/:id/respond', planController.respondToPlan);

module.exports = router;