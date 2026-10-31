const mongoose = require('mongoose');
const User = require('./user');

const friendSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

friendSchema.index({ requester: 1, receiver: 1 }, { unique: true });

friendSchema.statics.sendFriendRequest = async function (requesterId, receiverId) {
  if (String(requesterId) === String(receiverId)) {
    throw new Error("You can't add yourself");
  }
  const existing = await this.findOne({
    $or: [
      { requester: requesterId, receiver: receiverId },
      { requester: receiverId, receiver: requesterId },
    ],
  });
  if (existing) throw new Error('Request or friendship already exists');
  return this.create({ requester: requesterId, receiver: receiverId });
};

friendSchema.statics.getPendingRequests = function (userId) {
  return this.find({ receiver: userId, status: 'pending' })
    .populate('requester', 'username');
};

friendSchema.statics.areFriends = async function (a, b) {
  const doc = await this.findOne({
    status: 'accepted',
    $or: [
      { requester: a, receiver: b },
      { requester: b, receiver: a },
    ],
  });
  return !!doc;
};

friendSchema.statics.removeFriendById = function (friendshipId) {
  return this.findByIdAndDelete(friendshipId);
};

friendSchema.statics.acceptFriendRequest = function(friendshipId) {
    return this.findByIdAndUpdate(
        friendshipId,
        { status: 'accepted' },
        { new: true }
    )
    .populate('requester', 'username')
    .populate('receiver', 'username');
};

friendSchema.statics.getAcceptedFriends = function(userId) {
    return this.find({
        status: 'accepted',
        $or: [
            { requester: userId },
            { receiver: userId }
        ]
    })
    .populate('requester', 'username')
    .populate('receiver', 'username');
};

// friendSchema.statics.blockFriend = function(friendshipId) {
//     return this.findByIdAndUpdate(
//         friendshipId,
//         { status: 'blocked' },
//         { new: true }
//     )
//     .populate('requester', 'username')
//     .populate('receiver', 'username');
// };

friendSchema.statics.removeFriendByUsers = function(requesterId, receiverId) {
    return this.findOneAndDelete({
    $or: [
        {
            requester: requesterId,
            receiver: receiverId
        },
        {
            requester: receiverId,
            receiver: requesterId
        }
    ]
})};

const Friends = mongoose.model('Friends', friendSchema, 'friends');

module.exports = Friends;