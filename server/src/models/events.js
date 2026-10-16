const mongoose = require('mongoose')
const User = require('./user')
const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    organiser: {
        type: String,
        required:true
    },
    //if got same evets on diff days
    sessions: [{
        startTime: {
            type: Date,
            required: true
        },
        endTime: {
            type: Date,
            required: true
        }
    }],
    venue: {
        type: String,
        required: true
    },
    slots: {
        type: Number,
        default: null
    },
    signUpCount: {
        type: Number,
        default: 0
    },
    // to match with preferences
    tags: {
        type: [String],
        default: []
    },
    // if organiser posts their own event
    source: {
        type: String,
        enum: ['email', 'telegram', 'organiser'],
        required: true
    },
    sourceLink: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
},
{timestamps: true})

const Event = mongoose.model('Event', eventSchema, 'events')

module.exports = Event