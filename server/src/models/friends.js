const mongoose = require('mongoose')
const User = require('./user')

const friendSchema = new mongoose.Schema({
   requester: {type:Schema.Types.ObjectId, ref: 'User', required: true},
   receiver: {type: Schema.Types.ObjectId, ref: 'User', required: true},
   status:{
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
   },
   createdAt: {type: Date, default: Date.now} })

const Friends = mongoose.model('Friends', friendSchema, 'friends')


module.exports = Friends;