const express = require('express');

const userController = require('../controllers/userController');

const router = express.Router();

const multer = require('multer');
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const upload = multer({
    storage: multer.memoryStorage(),   // saved to the database by the controller
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (IMAGE_TYPES.includes(file.mimetype)) return cb(null, true);
        cb(new Error('Images must be PNG, JPG, WebP or GIF.'));
    }
});

// Runs the upload, and replies with a clear message if the file isn't allowed
const uploadImages = (fields) => (req, res, next) => {
    upload.fields(fields)(req, res, (err) => {
        if (!err) return next();
        const message = err.code === 'LIMIT_FILE_SIZE' ? 'Images must be 5 MB or smaller.' : err.message;
        return res.status(400).json({ message });
    });
};

// CREATE: Register a user
router.post('/', userController.createUser);

router.post('/register', uploadImages([
    { name: 'profileImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 },
    { name: 'avatar', maxCount: 1 }
]), userController.createUser);



//LOGIN
router.post('/login', userController.login);

// check if username is available 
router.get('/check-username/:username', userController.checkUsername);

//check if email has been used
router.get('/check-email/:email', userController.checkEmail);


// READ
router.get('/', userController.getUsers);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUserById);

//get preferences
router.get('/:id/preferences', userController.getPreferences);

// UPDATE
router.put('/:id', userController.updateUser);

// update profile picture and banner
router.put('/:id/images', uploadImages([
    { name: 'profileImage', maxCount: 1 },
    { name: 'bannerImage', maxCount: 1 }
]), userController.updateImages)

// DELETE
router.delete('/:id', userController.deleteUser);

//forgot password
router.post('/forgot-password', userController.forgotPassword);

router.post('/reset-password/:token', userController.resetPassword);


module.exports = router