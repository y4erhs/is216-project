const mongoose = require('mongoose');

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
        required: true
    },
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
    tags: {
        type: [String],
        default: []
    },
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
    }],
    status: {
    type: String,
    enum: ['pending', 'published', 'rejected'],
    default: 'published'
    },
    minGroup: { type: Number, default: null },   // null = no minimum
    maxGroup: { type: Number, default: null },   // null = no maximum
},
{ timestamps: true });

eventSchema.statics.createEvent = function(data) {
    return this.create(data);
};

eventSchema.statics.getEvents = function(filter = {}) {
    return this.find({ status: { $nin: ['pending', 'rejected'] }, ...filter })
        .sort({ 'sessions.startTime': 1 });
};

eventSchema.statics.getEventById = function(eventId) {
    return this.findById(eventId)
        .populate('attendees', 'username');
};

eventSchema.statics.updateEvent = function(eventId, updates) {
    return this.findByIdAndUpdate(
        eventId,
        updates,
        {
            new: true,
            runValidators: true
        }
    );
};

eventSchema.statics.deleteEvent = function(eventId) {
    return this.findByIdAndDelete(eventId);
};

eventSchema.statics.signUpUser = async function(eventId, userId) {
    const event = await this.findById(eventId);
    if(!event){
        return null;
    }
    const alreadySignedUp = event.attendees.some(
        attendee => attendee.toString() === userId.toString()
    );
    if(alreadySignedUp){
        return this.findById(eventId)
        .populate('attendees', 'username');
    }
    return this.findByIdAndUpdate(
        eventId,
        {
            $addToSet: {
                attendees: userId
            },
            $inc: {
                signUpCount: 1
            }
        },
        {
            new: true
        }
    ).populate('attendees', 'username');
};

const Event = mongoose.model('Event', eventSchema, 'events');

module.exports = Event;