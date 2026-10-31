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
    interests,
    avatar,
    banner,
    bio,
    school,
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
        interests,
        avatar,
        banner,
        bio,
        school,
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
    return this.findById(userId).select('preferences');
};

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;