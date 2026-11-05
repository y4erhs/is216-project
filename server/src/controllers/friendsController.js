const Friends = require('../models/friends')
const notificationController =require('./notificationController');
const User = require('../models/user');

// Loads a friend request or friendship, and refuses anyone who isn't allowed to change it
async function findForUser(req, res, allowedIds) {
    const friendship = await Friends.findById(req.params.friendshipId);
    if (!friendship) {
        res.status(404).json({ message: 'Friend request not found' });
        return null;
    }
    if (!allowedIds(friendship).some(id => String(id) === String(req.user.id))) {
        res.status(403).json({ message: "You can't change this friend request" });
        return null;
    }
    return friendship;
}
exports.sendFriendRequest = async(req,res) =>{
    try{
        const {requesterId,receiverId} = req.body;
        const request =await Friends.sendFriendRequest(requesterId,receiverId);
        const requester =await User.findById(requesterId);
        await notificationController.notifyFriendRequest(receiverId,requester.username,request._id, requester.avatar, requesterId);
        res.status(201).json(request);
    }catch(err){    
        res.status(500).json({error: err.message});
    }
};

exports.acceptFriendRequest = async(req,res) => {
    console.log("ACCEPT CONTROLLER HIT")
    try{
        const { friendshipId } = req.params;
        if (!(await findForUser(req, res, f => [f.receiver]))) return;   // only the person invited can accept
        const updated = await Friends.acceptFriendRequest(friendshipId);
        console.log(updated)
        console.log("UPDATED RECEIVER:", updated.receiver);
        console.log("AVATAR:", updated.receiver.avatar);
        await notificationController.notifyFriendAccepted(updated.requester._id, updated.receiver.username, updated.receiver.avatar, updated.receiver._id)
        res.json(updated);
    }catch(err){
        res.status(500).json({error: err.message});
    }
};

exports.rejectFriendRequest = async(req,res) => {
    try{
        const { friendshipId } = req.params;
        if (!(await findForUser(req, res, f => [f.requester, f.receiver]))) return;
        const removed =await Friends.findByIdAndDelete(friendshipId);
        if(!removed){
            return res.status(404).json({message: 'Friend request not found'});
        }
        res.json({
            message: 'Friend request rejected'
        });
    }catch(err){
        res.status(500).json({error: err.message});
    }
};

exports.getSentRequests = async (req, res) => {
  try {
    const sent = await Friends.getSentRequests(req.params.userId);
    res.json(sent.filter((r) => r.receiver)); // [] when none; receiver is null if that account was deleted
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    const pending = await Friends.getPendingRequests(userId);
    res.json(pending.filter((r) => r.requester)); // [] when none; requester is null if that account was deleted
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAcceptedFriends = async(req,res) =>{
    try{
        const {userId} = req.params;
        console.log(userId)
        const friends = (await Friends.getAcceptedFriends(userId)).filter((f) => f.requester && f.receiver);
        
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
        if (![requesterId, receiverId].some(id => String(id) === String(req.user.id))) {
            return res.status(403).json({ message: "You can't change this friendship" });
        }
        const removed = await Friends.removeFriendByUsers(requesterId, receiverId);
        if(!removed){
            return res.status(404).json({message: 'Friendship not found'});
        }
        res.json({message: 'Friendship removed', removed});
    }catch(err){
        res.status(500).json({ error: err.message});
    }
};

exports.removeFriendById = async (req, res) => {
  try {
    if (!(await findForUser(req, res, f => [f.requester, f.receiver]))) return;
    const removed = await Friends.removeFriendById(req.params.friendshipId);
    if (!removed) return res.status(404).json({ message: 'Friendship not found' });
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};