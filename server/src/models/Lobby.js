const mongoose = require('mongoose');
const Event = require('./events');
const Activity = require('./activity');
const { addSessionToGoogle } = require('../services/googleCalendarService');

const lobbySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        default: null
    },
    invited: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    declined: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastActiveAt:{
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    history: [{
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event'
        },
        memberIds: [{
            type: mongoose.Schema.Types.ObjectId,
            ref:'User'
        }],
        registeredAt: {
            type: Date,
            default: Date.now
        },
        count: {
            type: Number,
            default: 0
        }
    }]
});

lobbySchema.statics.createLobby = function(data) {
    const lobby = new this({
        ...data,
        participants: [data.host]
    });

    return lobby.save();
};

lobbySchema.statics.getLobbyForUser = function(userId) {
    return this.find({
        $or: [
            { host: userId },
            { participants: userId },
            { invited: userId},
            { declined: userId}
        ]
    })
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('declined', 'username')
    .populate('event');
};

lobbySchema.statics.getLobbyById = function(lobbyId) {
    return this.findById(lobbyId)
        .populate('host', 'username')
        .populate('invited', 'username')
        .populate('participants', 'username')
        .populate('declined', 'username')
        .populate('event')
        .populate('history.eventId')
        .populate('history.memberIds', 'username');
};

lobbySchema.statics.inviteUser = function(lobbyId, userId) {
    return this.findByIdAndUpdate(
        lobbyId,
        {
            $pull: { declined: userId },
            $addToSet: { invited: userId },
            lastActiveAt: Date.now()
        },
        { new: true }
    )
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('declined', 'username')
    .populate('event');
};

lobbySchema.statics.removeUser = function(lobbyId, userId) {
    return this.findByIdAndUpdate(
        lobbyId,
        {
            $pull: {
                participants: userId,
                invited: userId,
                declined: userId
            },
            lastActiveAt: Date.now()
        },
        {
            new: true
        }
    )
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('declined', 'username')
    .populate('event');
};

lobbySchema.statics.acceptInvite = function(lobbyId, userId) {
    return this.findByIdAndUpdate(
        lobbyId,
        {
            $pull: {
                invited: userId,
                declined: userId
            },
            $addToSet: {
                participants: userId
            },
            lastActiveAt: Date.now()
        },
        {
            new: true
        }
    )
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('declined', 'username')
    .populate('event');
};

lobbySchema.statics.declineInvite = function(lobbyId, userId) {
    return this.findByIdAndUpdate(
        lobbyId,
        {
            $pull: {
                invited: userId
            },
            $addToSet: {
                declined: userId
            },
            lastActiveAt: Date.now()
        },
        {
            new: true
        }
    )
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('declined', 'username')
    .populate('event');
};

lobbySchema.statics.signUpLobbyForEvent = async function(lobbyId) {
    const lobby = await this.findById(lobbyId)
        .populate('participants', '_id username')
        .populate('event');

    if (!lobby) throw new Error('Lobby not found');
    if (!lobby.event) throw new Error('Lobby has no linked event');

    const event = lobby.event;
    const participantIds = lobby.participants.map(p => p._id);

    // The session the lobby page shows = the next one that hasn't ended yet
    const now = new Date();
    const session = [...event.sessions]
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .find(s => new Date(s.endTime) > now);
    if (!session) throw new Error('This event has no upcoming session');

    // Only count people who weren't already signed up
    const already = new Set(event.attendees.map(String));
    const newCount = participantIds.filter(id => !already.has(String(id))).length;

    const updatedEvent = await Event.findByIdAndUpdate(
        event._id,
        {
            $addToSet: { attendees: { $each: participantIds } },
            $inc: { signUpCount: newCount }
        },
        { new: true }
    ).populate('attendees', 'username');

    // Make it show under "Attending" in Activity Tracking for every member
    const startMs = new Date(session.startTime).getTime();
    for (const userId of participantIds) {
        const filter = { user: userId, event: event._id };

        const existing = await Activity.findOne(filter);
        const old = existing?.sessions.find(s => new Date(s.startTime).getTime() === startMs);
        let googleEventId = old?.googleEventId || null;

        // a Google problem shouldn't block registration
        try {
            if (!googleEventId) googleEventId = await addSessionToGoogle(userId, event, session);
        } catch (err) {
            console.error('Google Calendar sync failed:', err.message);
        }

        // can't $pull and $push the same field in one update
        await Activity.updateOne(
            filter,
            { $pull: { sessions: { startTime: session.startTime } } },
            { upsert: true, setDefaultsOnInsert: true }
        );
        await Activity.updateOne(
            filter,
            { $push: { sessions: { startTime: session.startTime, going: 'attending', googleEventId } } }
        );
    }

    await this.findByIdAndUpdate(lobbyId, {
        $push: {
            history: {
                eventId: event._id,
                count: participantIds.length,
                memberIds: participantIds
            }
        },
        lastActiveAt: Date.now()
    });

    return updatedEvent;
};

lobbySchema.statics.deleteLobby = function(lobbyId) {
    return this.findByIdAndDelete(lobbyId);
};

const Lobby = mongoose.model('Lobby', lobbySchema, 'lobby');

module.exports = Lobby;