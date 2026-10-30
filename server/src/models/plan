const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
    creator:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title:         { type: String, required: true, trim: true },
    allDay:        { type: Boolean, default: false },
    startTime:     { type: Date, required: true },
    endTime:       { type: Date, required: true },
    location:      { type: String, default: '' },
    description:   { type: String, default: '' },
    invitees:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    googleEventId: { type: String, default: null }   // null if not added to Google
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema, 'plans');