const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Group',
            required: true
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['text', 'image'],
            default: 'text'
        },
        text: {
            type: String,
            default: ''
        },
        attachments: [{
            url: String,
            mimeType: String,
            size: Number
        }],
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
            default: null
        },
        mentions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        reactions: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            emoji: String
        }],
        editedAt: {
            type: Date,
            default: null
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
})

const Message = mongoose.model('Message', messageSchema, 'message')

module.exports= messageSchema