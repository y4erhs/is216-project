
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// CREATE a user
exports.createUser = async (req, res) => {
    try {
        const {
            username, email, password,
            dob, preferences, avatar, bio, major, year, ccas
        } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Username, email and password are required'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            dob, preferences, avatar, bio, major, year, ccas
        });

        const result = user.toObject();
        delete result.password;

        return res.status(201).json(result);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                message: 'Username or email already exists'
            });
        }

        return res.status(400).json({ message: err.message });
    }
};

// READ all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// READ one user
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json(user);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

// UPDATE a user's profile
exports.updateUser = async (req, res) => {
    try {
        const allowedFields = [
            'username', 'email', 'dob', 'preferences',
            'avatar', 'bio', 'major', 'year', 'ccas',
            'notificationPreferences'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json(user);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({
                message: 'Username or email already exists'
            });
        }

        return res.status(400).json({ message: err.message });
    }
};

// DELETE a user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
