const mongoose = require('mongoose')
const memberSchema = require('./member')

const socialSchema = new mongoose.Schema({
     name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    avatar: {
        type: String,
        default: '/uploads/default-group.png'
    },
    isPrivate: {
        type: Boolean,
        default: true
    },
    inviteCode: {
        type: String,
        unique: true,
        sparse: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [memberSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
})

const Social = mongoose.model('Social', socialSchema, 'socials');