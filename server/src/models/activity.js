const mongoose = require('mongoose')
require('./events')   // makes sure the 'Event' model is registered for populate
require('./user')

const activitySchema = new mongoose.Schema({
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true },
    event:      { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    interested: { type: Boolean, default: false },
    // one entry per session the user marked, identified by the session's startTime
    sessions: [{
        _id: false,
        startTime: { type: Date, required: true },
        going:     { type: String, enum: ['attending', 'attended'], required: true }
    }],
    note:       { type: String, default: '', maxlength: 1000 }
}, { timestamps: true })

// one record per user per event
activitySchema.index({ user: 1, event: 1 }, { unique: true })

module.exports = mongoose.model('Activity', activitySchema, 'activities')