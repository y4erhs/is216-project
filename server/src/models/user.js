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
        type: Array,
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
        
    }
})

const User = mongoose.model('User', userSchema, 'users');

exports.createUser = function({username, email, password, dob, perferences,role, avatar, bio}){
    return User.create({username, email, password, dob, role, avatar, bio});
}
