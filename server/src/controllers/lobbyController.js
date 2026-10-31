const Friends = require('../models/friends');
const Lobby = require('../models/Lobby')
const mongoose = require('mongoose')

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
        const result = lobbies.map(lobby => {
            const obj = lobby.toObject();

            obj.members = [
                ...lobby.participants.map(user => ({
                    id: user._id,
                    name: user.username,
                    status: 'accepted'
                })),

                ...lobby.invited.map(user => ({
                    id: user._id,
                    name: user.username,
                    status: 'pending'
                })),

                ...lobby.declined.map(user => ({
                    id: user._id,
                    name: user.username,
                    status: 'declined'
                }))
            ];

            obj.hostId = lobby.host?._id;
            obj.pitchedEventId = lobby.event?._id;

            return obj;
        });

        res.json(result);

    }catch(err){
        res.status(500).json({error:err.message})
    }
}

exports.getLobbyById = async (req, res) => {
    try {
        const { lobbyId } = req.params;

        const lobby = await Lobby.getLobbyById(lobbyId);

        if (!lobby) {
            return res.status(404).json({
                message: 'Lobby not found'
            });
        }

        const result = lobby.toObject();
        result.members = [
            ...lobby.participants.map(user => ({
                id: user._id,
                name: user.username,
                status: 'accepted'
            })),

            ...lobby.invited.map(user => ({
                id: user._id,
                name: user.username,
                status: 'pending'
            })),

            ...lobby.declined.map(user => ({
                id: user._id,
                name: user.username,
                status: 'declined'
            }))
        ];
        result.hostId = lobby.host?._id;
        result.pitchedEventId = lobby.event?._id;
        res.json(result)

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

exports.inviteUser = async (req, res) => {
  try {
    const { lobbyId, userId, inviterId } = req.body;

    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

    const same = (a, b) => String(a) === String(b);
    if (!lobby.participants.some(id => same(id, inviterId))) {
      return res.status(403).json({ message: 'Only lobby members can invite' });
    }
    if ([...lobby.participants, ...lobby.invited].some(id => same(id, userId))) {
      return res.status(400).json({ message: 'Already in this lobby or invited' });
    }
    if (!(await Friends.areFriends(inviterId, userId))) {
      return res.status(403).json({ message: 'You can only invite friends' });
    }

    const updated = await Lobby.inviteUser(lobbyId, userId);
    // TODO (notifications): create 'lobby_invite' notification for userId
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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

// Edit name and description
exports.updateLobby = async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Name is required' });
        }
        const updated = await Lobby.findByIdAndUpdate(
            req.params.lobbyId,
            { name: name.trim(), description: (description || '').trim(), lastActiveAt: Date.now() },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: 'Lobby not found' });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Pitch an event (or send eventId: null to clear it)
exports.pitchEvent = async (req, res) => {
    try {
        const { eventId } = req.body;
        if (eventId && !mongoose.isValidObjectId(eventId)) {
            return res.status(400).json({ message: 'Invalid event id' });
        }

        const lobby = await Lobby.findById(req.params.lobbyId);
        if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

        const alreadyRegistered = lobby.event &&
            lobby.history.some(h => String(h.eventId) === String(lobby.event));
        if (alreadyRegistered) {
            return res.status(400).json({ message: 'Group already registered. Plan another event first.' });
        }

        lobby.event = eventId || null;
        lobby.lastActiveAt = Date.now();
        await lobby.save();
        res.json(lobby);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Same group, next event: clear the event and ask everyone to reply again
exports.planNext = async (req, res) => {
    try {
        const lobby = await Lobby.findById(req.params.lobbyId);
        if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

        const hostId = String(lobby.host);
        const others = [...lobby.participants, ...lobby.invited, ...lobby.declined]
            .filter(id => String(id) !== hostId);
        const unique = [...new Map(others.map(id => [String(id), id])).values()];

        lobby.event = null;
        lobby.participants = [lobby.host];
        lobby.invited = unique;      // everyone except the host is pending again
        lobby.declined = [];
        lobby.lastActiveAt = Date.now();
        await lobby.save();
        res.json(lobby);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.joinViaLink = async (req, res) => {
  try {
    const { lobbyId } = req.params;
    const { userId } = req.body; // from auth later
    if (!mongoose.isValidObjectId(lobbyId)) {
      return res.status(400).json({ message: 'Invalid lobby id' });
    }
    const lobby = await Lobby.findById(lobbyId);
    if (!lobby) return res.status(404).json({ message: 'Lobby not found' });

    const updated = await Lobby.acceptInvite(lobbyId, userId);
    // TODO (notifications): 'lobby_joined_via_link' goes here, giselle's part
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};