const mongoose = require('mongoose')
const User = require('./user')
const Event = require('./events')
const lobbySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {type:String},
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    event:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    invited: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    participants :[{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt:{
        type: Date,
        default: Date.now
    }
})

const Lobby = mongoose.model('Lobby', lobbySchema, 'lobby');

exports.createLobby = function(data){
    const lobby = new Lobby(data);
    return lobby.save()
}

exports.getLobbyforUser = function(userId){
    return Lobby.find({
        $or:[
            {host: userId},
            {participants: userId}
        ]
    }).populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('event')
}

exports.inviteUser = function(lobbyId, userId){
    return Lobby.findByIdAndUpdate(
        lobbyId,
        {$addToSet:{
            invited: userId
        }},
        {new:true}
    ).populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('event')
}

exports.removeUser = function(lobbyId, userId){
    return Lobby.findByIdAndUpdate(
        lobbyId,
        {$pull: {participants: userId}},
        {new: true}
    ).populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('event');
}

exports.acceptInvite = function(lobbyId, userId){
    return Lobby.findByIdAndUpdate(
        lobbyId,
        {
            $pull: { invited: userId},
            $addToSet : { participants: userId}
        }, 
        {new:true}
    ).populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('event');
}

exports.declineInvite = function(lobbyId, userId){
    return Lobby.findByIdAndUpdate(
        lobbyId,
        {
            $pull: { invited: userId }
        },
        {new:true}
    ).populate('host', 'username')
    .populate('invited', 'username')
    .populate('participants', 'username')
    .populate('event')
}

exports.signUpLobbyForEvent = async function(lobbyId){
    const lobby = await Lobby.findById(lobbyId)
    .populate('participants', '_id username')
    .populate('event');

  if (!lobby) throw new Error('Lobby not found');
  if (!lobby.event) throw new Error('Lobby has no linked event');

  const participantIds = lobby.participants.map(p => p._id);

  const updatedEvent = await Event.findByIdAndUpdate(
    lobby.event._id,
    {
      $addToSet: { attendees: { $each: participantIds } },
      $inc: { signUpCount: participantIds.length }
    },
    { new: true }
  ).populate('attendees', 'username');

  return updatedEvent;
}

exports.deleteLobby = function(lobbyId){
    return Lobby.findByIdAndDelete(lobbyId);
}


module.exports = Lobby