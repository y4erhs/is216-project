const mongoose = require('mongoose');
const GoogleConnection = require('./googleConnection');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
    type: String,
    default: ''
    },
    displayName: {
    type: String,
    default: ''
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // 'google' accounts sign in with Continue with Google; their password is random and unused
    authProvider: {
        type: String,
        enum: ['local', 'google'],
        default: 'local'
    },
    avatar: {
        type: String,
        default: '/uploads/default.png'
    },
    banner: {
        type: String,
        default: '/uploads/default.png'
    },
    dob: {
        type: Date,
        default: null
    },
    interests: {
        type: [String],
        default: []
    },
    bio: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    Calendar: {

    },
    school: {
        type: String,
        default: ''
    },
    year: {
        type: String,
        default: ''
    },
    major: {
        type: String,
        default: ''
    },
    graduationYear: {
        type: String,
        default: ''
    },
    ccas: {
        type: [String],
        default: []
    },
    notificationPreferences: {
        push: {
            type: Boolean,
            default: true
        },
        email: {
            type: Boolean,
            default: true
        },
        remindMinutesBefore: {
            type: Number,
            default: 15
        },
        upcomingEvents: {
            type: Boolean,
            default: true
        },
        lobbyActivity: {
            type: Boolean,
            default: true
        },
        plans: {
            type: Boolean,
            default: true
        }
    },

    resetPasswordToken: { 
        type: String, 
        default: null 
    },
    resetPasswordExpires: { 
        type: Date, 
        default: null
    }
        
});

userSchema.statics.createUser = function({
    username,
    fullName,
    displayName,
    email,
    password,
    authProvider,
    dob,
    interests,
    avatar,
    banner,
    bio,
    school,
    major,
    year,
    ccas
}) {
    return this.create({
        username,
        fullName,
        displayName,
        email,
        password,
        authProvider,
        dob,
        interests,
        avatar,
        banner,
        bio,
        school,
        major,
        year,
        ccas
    });
};

userSchema.statics.getUsers = function() {
    return this.find().select('username avatar');
};

userSchema.statics.getUserById = function(userId) {
    return this.findById(userId).select('-password -resetPasswordToken -resetPasswordExpires');
};

userSchema.statics.findByUsername = function(username){
    return this.findOne({ username});
};

userSchema.statics.updateUser = function(userId, updates) {
    return this.findByIdAndUpdate(
        userId,
        updates,
        {
            new: true,
            runValidators: true
        }
    ).select('-password');
};

userSchema.statics.deleteUser = async function(userId) {
    const user = await this.findByIdAndDelete(userId);
    if (!user) {
        return null;
    }

    await GoogleConnection.deleteMany({ user: userId });

    return user;
};

userSchema.statics.getPreferences = function(userId) {
    return this.findById(userId).select('interests');
};

// Of these users, the ones who have this alert switched on (accounts from before the setting count as on)
userSchema.statics.idsWantingAlert = async function(userIds, setting) {
    const users = await this.find({
        _id: { $in: userIds },
        [`notificationPreferences.${setting}`]: { $ne: false }
    }).select('_id');
    return users.map(user => user._id);
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;