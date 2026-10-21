const express = require('express');

const eventController = require('../controllers/eventController');

const router = express.Router();


// CREATE
router.post('/', eventController.createEvent);

// READ
router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEventById);

// UPDATE
router.put('/:id', eventController.updateEvent);

// DELETE
router.delete('/:id', eventController.deleteEvent);

router.post('/signup', eventController.signUpUser);
module.exports = router