const mongoose = require('mongoose')
const User = require('./user')

const lobbySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {type:String},
    host: {
        type: Schema.Types.ObjectId,
        ref:'User',
        required: true
    },
    invited: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    participants :[{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    status:{
        type:String,
        enum: ['upcoming', 'ongoing', 'ended'],
        default: 'upcoming'
    },
    eventDate: {
        type: Date
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
})

const Lobby = mongoose.model('Lobby', lobbySchema, 'lobby');

exports.getLobbyforUser = function(userId){
    return Lobby.find({
        $or:[
            {host: userId},
            {invited: userId},
            {participants: userId}
        ]
    }).populate('host participants')
}

exports.deleteUser = function(userId){
    return Lobby.findByIdAdnUpdate(
        lobbyId,
        {$pull: {participants: userId}},
        {new: true}
    ).populate('host participants');
}

exports.deleteLobby = function(lobbyId){
    return Lobby.deleteOne({_id: lobbyId});
}


module.exports = Lobby