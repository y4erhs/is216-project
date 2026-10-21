const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
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
    preferences:{
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
    Calendar:{
        
    },
    major: { 
        type: String, 
        default: '' 
    },
    year: {
        type: Number,
        default: null,
    },
    ccas: {
        type: [String],
        default: [],
    },
    notificationPreferences: {
        push: {
            type: Boolean,
            default: true,
        },
        email: {
            type: Boolean,
            default: true,
        },
        reminndMinutesBefore: {
            type: Number,
            default: 15
        }
    }
})

const User = mongoose.model('User', userSchema, 'users')

module.exports = User

exports.createUser = function({
    username,email,password,dob,preferences,avatar,bio,major,year,ccas})
    {
    return User.create({
        username,email,password,dob,preferences,avatar,bio,major,year,ccas
    });
};

exports.getUsers = function() {
    return User.find().select('-password');
};

exports.getUserById = function(userId) {
    return User.findById(userId).select('-password');
};

exports.updateUser = function(userId, updates) {
    return User.findByIdAndUpdate(
        userId,
        updates,
        {
            new: true,
            runValidators: true
        }
    ).select('-password');
};

exports.deleteUser = function(userId) {
    return User.findByIdAndDelete(userId);
};

exports.getPreferences = function(userId) {
    return User.findById(userId).select('preferences');
};