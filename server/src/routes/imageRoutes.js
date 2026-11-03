const express = require('express');
const imageController = require('../controllers/imageController');

const router = express.Router();

router.get('/:id', imageController.getImage);

module.exports = router;
