const mongoose = require('mongoose')

const memberSchema = new mongoose.Schema({
    user:{type:mongoose.Schema.Types.ObjectId, ref:'User', required: true},
    role:{
        type:String,
        enum: ['owner', 'member'],
        default: 'member'
    },
    joinedAt: {type:Date, default: Date.now},
    lastReadAt: {type: Date, default: Date.now}
},{ _id: false })

const Member = mongoose.model('Member', memberSchema, 'member')

module.exports = Member