const express = require('express');

const userController = require('../controllers/userController');

const router = express.Router();

// CREATE: Register a user
router.post('/', userController.createUser);

// READ
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

// UPDATE
router.put('/:id', userController.updateUser);

// DELETE
router.delete('/:id', userController.deleteUser);

module.exports = router