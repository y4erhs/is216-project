const mongoose = require('mongoose')

const recommendationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    score: {
        type: Number,
        default: 0
    },
    reasons: {
        type: [String],
        deafult: []
    },
    feedType: {
        type: String,
        enum: ['daily', 'weekly'],
        default: 'weekly'
    },
    isInterested: {
        type: Boolean,
        default: true
    },
    lesslikethis: {
        type: Boolean,
        default: false
    },
    expiresAt: { 
        type: Date, 
        required: true 
    }
}, {timestamps: true})

// One recommendation per user per event
recommendationSchema.index({ user: 1, event: 1 }, { unique: true })

// MongoDB automatically deletes the recommendation once expiresAt passes
recommendationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Recommendation = mongoose.model('Recommendation', recommendationSchema, 'recommendations')

module.exports = Recommendation