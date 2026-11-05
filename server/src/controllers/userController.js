const { LengthFinishReasonError } = require('openai/error.js');
const User = require('../models/user');
const Friends = require('../models/friends');
const Image = require('../models/image');
const { signLoginToken } = require('../middleware/authCheck');
const GoogleSignInCode = require('../models/googleSignInCode');
const { isEmailSetUp, sendPasswordResetEmail } = require('../services/emailService');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Same password rules as the signup and reset pages. Returns the problem, or null if it's fine.
function passwordProblem(password) {
    if (String(password).length < 8) {
        return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password) || !/\d/.test(password) || !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return 'Password must include at least 1 capital letter, 1 number, and 1 special character.';
    }
    return null;
}

// CREATE a user
exports.createUser = async (req, res) => {
    try {
        let {
            username, fullName, displayName, email, password,
            dob, interests, avatar, banner, bio, school, major, year, ccas, googleCode
        } = req.body;

        // Signing up with Google: the verified email comes from Google, and there's no password to choose
        let googleSignup = null;
        if (googleCode) {
            googleSignup = await GoogleSignInCode.findOne({
                code: String(googleCode), kind: 'signup', expiresAt: { $gt: new Date() }
            });
            if (!googleSignup) {
                return res.status(400).json({ message: 'That Google sign-up has expired. Please try again.' });
            }
            email = googleSignup.email;
            password = crypto.randomBytes(32).toString('hex') + 'Aa1!';
        }

        if (!username || !email || !password) {
            return res.status(400).json({
                message: 'Username, email and password are required'
            });
        }
        const problem = passwordProblem(password);
        if (problem) {
            return res.status(400).json({ message: problem });
        }
        if(!email.endsWith('@smu.edu.sg')){
            return res.status(400).json({
                message: 'Only SMU email addresses are allowed'
            })
        };

        if (req.files) {
            if (req.files.profileImage && req.files.profileImage[0]) {
                avatar = await Image.saveUpload(req.files.profileImage[0]);
            } else if (req.files.avatar && req.files.avatar[0]) {
                avatar = await Image.saveUpload(req.files.avatar[0]);
            }
            if (req.files.bannerImage && req.files.bannerImage[0]) {
                banner = await Image.saveUpload(req.files.bannerImage[0]);
            }
        }

        if (typeof interests === 'string') {
            try { interests = JSON.parse(interests); } catch (e) { interests = {}; }
        }
        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await User.createUser({
            username, fullName, displayName,
            email,
            password: hashedPassword,
            authProvider: googleSignup ? 'google' : 'local',
            dob, interests, avatar, banner, bio, school, major, year, ccas
        });

        if (googleSignup) await GoogleSignInCode.deleteOne({ _id: googleSignup._id });

        const result = user.toObject();
        delete result.password;

        return res.status(201).json({ ...result, token: signLoginToken(user._id) });
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

        if (user.authProvider === 'google') {
            return res.status(401).json({
                message: 'This account uses Continue with Google.'
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
            user:result,
            token: signLoginToken(user._id)
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
        if (user.authProvider === 'google') {
            return res.status(400).json({ message: 'This account uses Continue with Google, so it has no password to reset.' });
        }

        // 2. Generate a secure reset token & expiration (valid for 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        // 3. Without email settings (e.g. running locally), the link goes to the server's logs instead
        if (!isEmailSetUp()) {
            console.log(`🔗 PASSWORD RESET LINK for ${user.email}: ${resetUrl}`);
            return res.status(200).json({
                message: "Email isn't set up on this server, so the reset link is in the server's logs."
            });
        }

        // 4. Email the link to the address saved on the account
        try {
            await sendPasswordResetEmail(user.email, resetUrl);
        } catch (err) {
            console.error('Could not send password reset email:', err.message);
            return res.status(502).json({ message: 'Could not send the reset email. Please try again.' });
        }

        return res.status(200).json({
            message: 'Password reset link sent to your email!'
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'New password is required' });
        }
        const problem = passwordProblem(password);
        if (problem) {
            return res.status(400).json({ message: problem });
        }

        // 1. Find user by token and ensure the token hasn't expired
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // $gt means "greater than current time"
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
        }

        // 2. Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // 3. Clear the reset token fields so it can't be used again
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        return res.status(200).json({ message: 'Password has been successfully reset! You can now log in.' });

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
            'graduationYear',
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

        // their friend requests and friendships go with them
        await Friends.deleteMany({ $or: [{ requester: req.params.id }, { receiver: req.params.id }] });
        await Image.removeByPath(user.avatar);
        await Image.removeByPath(user.banner);

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

// search for users
exports.searchUsers = async (req, res) => {
  try {
    const { q = '', userId } = req.query;
    if (q.trim().length < 2) return res.json([]);
    const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // escape regex characters
    const users = await User.find({
      username: { $regex: safe, $options: 'i' },
      ...(userId && { _id: { $ne: userId } }),
    }).select('_id username avatar').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check if the username already exists (case-insensitive)
    const existingUser = await User.findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });

    return res.status(200).json({ exists: !!existingUser });
  } catch (error) {
    console.error('Error checking username:', error);
    return res.status(500).json({ message: 'Server error while checking username' });
  }
};

exports.checkEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    // Check if the email already exists (case-insensitive)
    const existingEmail = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    return res.status(200).json({ exists: !!existingEmail });
  } catch (error) {
    console.error('Error checking email:', error);
    return res.status(500).json({ message: 'Server error while checking email' });
  }
};

// update profile picture or banner

exports.updateImages = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const updateData = {};

        const existing = await User.findById(userId).select('avatar banner');
        if (!existing) return res.status(404).json({ message: 'User not found' });

        if (req.files?.profileImage) {
            updateData.avatar = await Image.saveUpload(req.files.profileImage[0]);
        }

        // If multer processed a new banner image
        if (req.files?.bannerImage) {
            updateData.banner = await Image.saveUpload(req.files.bannerImage[0]);
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

        // the pictures they just replaced aren't needed any more
        if (updateData.avatar) await Image.removeByPath(existing.avatar);
        if (updateData.banner) await Image.removeByPath(existing.banner);

        return res.status(200).json({ message: 'Images updated successfully', user: updatedUser });
  } catch (error) {
        console.log("Error updating image: ", error);
        return res.status(500).json({ message: 'Server error updating profile images' });
    }
};
