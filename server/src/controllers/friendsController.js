const Friends = require('../models/friends')

exports.sendFriendRequest = async(req,res) =>{
    try{
        const { requesterId, receiverId } = req.body;
        const request = await Friends.sendFriendRequest(requesterId, receiverId)
        res.status(201).json(request)
    }catch(err){
        res.status(500).json({error: err.message});
    }
};

exports.acceptFriendRequest = async(req,res) => {
    try{
        const { friendshipId } = req.params;
        const updated = await Friends.acceptFriendRequest(friendshipId);
        res.json(updated);
    }catch(err){
        res.status(500).json({error: err.message});
    }
};

exports.getAcceptedFriends = async(req,res) =>{
    try{
        const {userId} = req.params;
        const friends = await Friends.getAcceptedFriends(userId);
        if(!friends || friends.length === 0 ){
            return res.status(404).json({ message: 'No accepted friends found'})
        }
        res.json(friends)
    }catch(err){
        res.status(500).json({error: err.message})
    }
}

// exports.blockFriend = async(req,res) =>{
//     try{
//         const { friendshipId } = req.params;
//         const updated = await Friends.blockFriend(friendshipId);
//         res.json(updated);
//     }catch(err){
//         res.status(500).json({error: err.message})
//     }
// };

exports.removeFriend = async(req,res) =>{
    try{
        const {requesterId, receiverId } = req.body;
        const removed = await Friends.removeFriendByUsers(requesterId, receiverId);
        if(!removed){
            return res.status(404).json({message: 'Friendship not found'});
        }
        res.json({message: 'Friendship removed', removed});
    }catch(err){
        res.status(500).json({ error: err.message});
    }
};