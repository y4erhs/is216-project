const express = require('express');

const eventController = require('../controllers/eventController');

const { requireAuth, selfField } = require('../middleware/authCheck');

const router = express.Router();


// CREATE
router.post('/', requireAuth, eventController.createEvent);

// READ
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);

// UPDATE
router.put('/:id', requireAuth, eventController.updateEvent);

// DELETE
router.delete('/:id', requireAuth, eventController.deleteEvent);

router.post('/signup', requireAuth, selfField('body', 'userId'), eventController.signUpUser);
module.exports = router