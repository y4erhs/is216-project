const mongoose = require('mongoose');
const Event = require('./events');

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
        required: true
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
            $addToSet: {
                invited: userId
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

lobbySchema.statics.removeUser = function(lobbyId, userId) {
    return this.findByIdAndUpdate(
        lobbyId,
        {
            $pull: {
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

    if (!lobby.event) {
        throw new Error('Lobby has no linked event');
    }

    const participantIds = lobby.participants.map(
        p => p._id
    );

    const updatedEvent = await Event.findByIdAndUpdate(
    lobby.event._id,
    {
        $addToSet: {
            attendees: {
                $each: participantIds
            }
        },
        $inc: {
            signUpCount: participantIds.length
        }
    },
    {
        new: true
    }).populate('attendees', 'username');

    await this.findByIdAndUpdate(
    lobbyId,
    {
        $push: {
            history: {
                eventId: lobby.event._id,
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