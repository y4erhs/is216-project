const Lobby = require('../models/Lobby')

exports.createLobby = async(req,res) =>{
    try{
        const lobby = await Lobby.createLobby(req.body);
        res.status(201).json(lobby)
    }catch(err){
        res.status(500).json({ error:err.message});
    }
}

exports.getLobbyForUser = async (req,res) =>{
    try{
        const {userId} = req.params;
        const lobbies = await Lobby.getLobbyForUser(userId);
        res.json(lobbies)
    }catch(err){
        res.status(500).json({error:err.message})
    }
}

exports.inviteUser = async(req,res) =>{
    try{
        const {lobbyId, userId} = req.body;
        const updated = await Lobby.inviteUser(lobbyId, userId);
        res.json(updated)
    }catch(err){
        res.status(500).json({ error:err.message})
    }
}

exports.acceptInvite = async (req,res) =>{
    try{
        const {lobbyId, userId} = req.body;
        const updated = await Lobby.acceptInvite(lobbyId, userId);
        res.json(updated)
    }catch(err){
        res.status(500).json({ error:err.message})
    }
}

exports.declineInvite = async(req,res) =>{
    try{
        const {lobbyId, userId} = req.body;
        const updated = await Lobby.declineInvite(lobbyId, userId);
        res.json(updated)
    }catch(err){
        res.status(500).json({ error: err.message})
    }
}

exports.removeUser = async (req,res) =>{
    try{
        const {lobbyId, userId} = req.body;
        const updated = await Lobby.removeUser(lobbyId, userId);
        res.json(updated)
    }catch(err){
        res.status(500).json({ error: err.message})
    }
}

exports.signUpLobbyForEvent = async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const updatedEvent = await Lobby.signUpLobbyForEvent(lobbyId);
    res.json(updatedEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteLobby = async(req,res) =>{
    try{
        const {lobbyId} = req.params;
        const deleted = await Lobby.deleteLobby(lobbyId);
        if(!deleted){
            return res.status(404).json({ message: 'Lobby not found'});
        }
        res.json({ message: 'Lobby deleted'})
    }catch(err){
        res.status(500).json({ error: err.message})
    }
}