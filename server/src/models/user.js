const mongoose = require('mongoose');

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
    avatar: {
        type: String,
        default: '/uploads/default.png'
    },
    dob: {
        type: Date,
        default: null
    },
    preferences: {
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
    major: {
        type: String,
        default: ''
    },
    year: {
        type: Number,
        default: null
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
        }
    }
});

userSchema.statics.createUser = function({
    username,
    fullName,
    displayName,
    email,
    password,
    dob,
    preferences,
    avatar,
    bio,
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
        dob,
        preferences,
        avatar,
        bio,
        major,
        year,
        ccas
    });
};

userSchema.statics.getUsers = function() {
    return this.find().select('-password');
};

userSchema.statics.getUserById = function(userId) {
    return this.findById(userId).select('-password');
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

userSchema.statics.deleteUser = function(userId) {
    return this.findByIdAndDelete(userId);
};

userSchema.statics.getPreferences = function(userId) {
    return this.findById(userId).select('preferences');
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;