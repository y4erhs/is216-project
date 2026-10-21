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
    createdAt: {
        type: Date,
        default: Date.now
    }
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
            { invited: userId}
        ]
    })
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('event');
};

lobbySchema.statics.inviteUser = function(lobbyId, userId) {
    return this.findByIdAndUpdate(
        lobbyId,
        {
            $addToSet: {
                invited: userId
            }
        },
        {
            new: true
        }
    )
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('event');
};

lobbySchema.statics.removeUser = function(lobbyId, userId) {
    return this.findByIdAndUpdate(
        lobbyId,
        {
            $pull: {
                participants: userId
            }
        },
        {
            new: true
        }
    )
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('event');
};

lobbySchema.statics.acceptInvite = function(lobbyId, userId) {
    return this.findByIdAndUpdate(
        lobbyId,
        {
            $pull: {
                invited: userId
            },
            $addToSet: {
                participants: userId
            }
        },
        {
            new: true
        }
    )
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('event');
};

lobbySchema.statics.declineInvite = function(lobbyId, userId) {
    return this.findByIdAndUpdate(
        lobbyId,
        {
            $pull: {
                invited: userId
            }
        },
        {
            new: true
        }
    )
    .populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
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
        }
    ).populate('attendees', 'username');

    return updatedEvent;
};

lobbySchema.statics.deleteLobby = function(lobbyId) {
    return this.findByIdAndDelete(lobbyId);
};

const Lobby = mongoose.model('Lobby', lobbySchema, 'lobby');

module.exports = Lobby;