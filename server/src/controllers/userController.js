const { LengthFinishReasonError } = require('openai/error.js');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');


// CREATE a user
exports.createUser = async (req, res) => {
    console.log("backend reached! /api/users/register was called with body:", req.body);
    console.log("📁 Files received:", req.files);
    try {
        let {
            username, fullName, displayName, email, password,
            dob, interests, avatar, bio, major, year, ccas
        } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Username, email and password are required'
            });
        }
        if(!email.endsWith('@smu.edu.sg')){
            return res.status(400).json({
                message: 'Only SMU email addresses are allowed'
            })
        };

        if (req.files) {
            if (req.files.profileImage && req.files.profileImage[0]) {
                avatar = `/uploads/${req.files.profileImage[0].filename}`;
            } else if (req.files.avatar && req.files.avatar[0]) {
                avatar = `/uploads/${req.files.avatar[0].filename}`;
            }
        }

        if (typeof interests === 'string') {
            try { interests = JSON.parse(interests); } catch (e) { interests = {}; }
        }
        if (year !== undefined && year !== null && year !== '') {
            const parsedYear = Number(year);
            year = isNaN(parsedYear) ? undefined : parsedYear;
        } else {
            year = undefined; 
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.createUser({
            username, fullName, displayName,
            email,
            password: hashedPassword,
            dob, interests, avatar, bio, major, year, ccas
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
        const users = await User.getUsers();
        return res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};

// READ one user
exports.getUserById = async (req, res) => {
    try {
        const user = await User.getUserById(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json(user);

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

exports.login = async(req,res) =>{
    try{
        const { username, password} = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        const user = await User.findByUsername(username);
        if(!user){
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const match = await bcrypt.compare(
            password, user.password
        )

        if(!match){
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const result = user.toObject();
        delete result.password;

        return res.status(200).json({
            message: 'Login successful',
            user:result
        });
    }catch(err){
        return res.status(500).json({
            message: err.message
        });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // 1. Check if user exists in the database
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'This email is not registered in our database.' });
        }

        // 2. Generate a secure reset token & expiration (valid for 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        // 3. Simulate sending email (Check your backend terminal for this link!)
        const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
        console.log(`🔗 PASSWORD RESET LINK for ${email}: ${resetUrl}`);

        return res.status(200).json({ 
            message: 'Password reset link sent to your email!' 
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// UPDATE a user's profile
exports.updateUser = async (req, res) => {
    try {
        const allowedFields = [
            'username',
            'fullName',
            'displayName',
            'email',
            'dob',
            'interests',
            'avatar',
            'bio',
            'major',
            'year',
            'ccas',
            'notificationPreferences'
        ];

        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const user = await User.updateUser(
            req.params.id,
            updates
        );

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

        return res.status(400).json({
            message: err.message
        });
    }
};

// DELETE a user
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.deleteUser(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json({
            message: 'User deleted successfully'
        });

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

//get all the interests indicated by user
exports.getPreferences = async (req, res) => {
    try {
        const user = await User.getPreferences(req.params.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        return res.status(200).json(user.interests);

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

