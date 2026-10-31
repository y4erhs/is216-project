const express = require('express');

const userController = require('../controllers/userController');

const router = express.Router();

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// CREATE: Register a user
router.post('/', userController.createUser);

router.post('/register', upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 },
    { name: 'avatar', maxCount: 1 }
]), userController.createUser);



//LOGIN
router.post('/login', userController.login);

// READ
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);

//get preferences
router.get('/:id/preferences', userController.getPreferences);

// UPDATE
router.put('/:id', userController.updateUser);

// DELETE
router.delete('/:id', userController.deleteUser);


module.exports = router