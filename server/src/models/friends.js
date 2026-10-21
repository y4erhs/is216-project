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

friendSchema.statics.sendFriendRequest = function(requesterId, receiverId) {
    const request = new this({
        requester: requesterId,
        receiver: receiverId,
        status: 'pending'
    });

    return request.save();
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