const mongoose = require('mongoose')
const User = require('./user')

const friendSchema = new mongoose.Schema({
   requester: {type:mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
   receiver: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
   status:{
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
   },
   createdAt: {type: Date, default: Date.now} })

const Friends = mongoose.model('Friends', friendSchema, 'friends')

exports.sendFriendRequest = function(requesterId, receiverId){
   const request = new Friends({
      requester: requesterId,
      receiver: receiverId,
      status: 'pending'
   });
   return request.save()
}

exports.acceptFriendRequest = function(friendshipId){
   return Friends.findByIdAndUpdate(
      friendshipId,
      {status: 'accepted'},
      {new:true}
   ).populate('requester', 'username')
   .populate('receiver', 'username')
}

exports.getAcceptedFriends = function(userId){
   return Friends.find({
      status: 'accepted',
      $or: [
         {requester: userId},
         {receiver: userId}
      ]
   }).populate('requester', 'username')
   .populate('receiver', 'username')
}
// exports.blockFriend = function(friendshipId){
//    return Friends.findByIdAndUpdate(
//       friendshipId,
//       {status: 'blocked'},
//       { new:true}
//    ).populate('requester', 'username')
//    .populate('receiver', 'username')
// }

exports.removeFriendByUsers = function(requesterId, receiverId){
   return Friends.findOneAndDelete({
      requester: requesterId,
      receiver: receiverId
   }).populate('requester', 'username')
   .populate('receiver', 'username')
}
module.exports = Friends;