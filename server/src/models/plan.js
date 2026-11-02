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
    accepted:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // invitees who said yes
    declined:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],   // invitees who said no
    googleEventId: { type: String, default: null },   // null if not added to Google
    lobby:         { type: mongoose.Schema.Types.ObjectId, ref: 'Lobby', default: null, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Plan', planSchema, 'plans');