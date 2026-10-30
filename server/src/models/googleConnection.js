const mongoose = require('mongoose')

const googleConnectionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    refreshToken: {
        type: String,
        required: true,
        select: false
    },
    googleEmail: {
        type: String
    },
    connectedAt: {
        type: Date,
        default: Date.now
    },
    includePersonal: { type: Boolean, default: false }
})

module.exports = mongoose.model('GoogleConnection', googleConnectionSchema)