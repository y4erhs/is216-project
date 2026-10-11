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

const User = mongoose.model('User', userSchema, 'users');

exports.createUser = function({username, email, password, dob, preferences, role, avatar, bio}){
    return User.create({username, email, password, dob, role, avatar, bio});
}
