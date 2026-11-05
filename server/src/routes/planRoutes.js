const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { requireAuth, selfField } = require('../middleware/authCheck');

router.use(requireAuth);

router.get('/', selfField('query', 'userId'), planController.listPlans);
router.post('/', selfField('body', 'userId'), planController.createPlan);
router.post('/sync', selfField('body', 'userId'), planController.syncPlans);
router.put('/:id', selfField('body', 'userId'), planController.updatePlan);
router.delete('/:id', selfField('query', 'userId'), planController.deletePlan);
router.put('/:id/respond', selfField('body', 'userId'), planController.respondToPlan);

module.exports = router;