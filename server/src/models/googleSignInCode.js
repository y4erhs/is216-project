const mongoose = require('mongoose')

// Short-lived, single-use codes for "Continue with Google"
const googleSignInCodeSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    // state: guards the trip to Google. login: logs in an existing user. signup: finishes a new account.
    kind: { type: String, enum: ['state', 'login', 'signup'], required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    email: { type: String, default: '' },
    name: { type: String, default: '' },
    expiresAt: { type: Date, required: true }
})

// MongoDB deletes each code once it expires
googleSignInCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('GoogleSignInCode', googleSignInCodeSchema)
