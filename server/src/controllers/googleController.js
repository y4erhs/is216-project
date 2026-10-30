const { createOAuthClient } = require('../utils/googleClient')
const GoogleConnection = require('../models/googleConnection')
const mongoose = require('mongoose')

// Step 1: send the user to Google's permission screen
exports.connect = (req, res) => {
    // TEMPORARY: replace with the logged-in user once login exists
    const userId = req.query.userId
    if (!mongoose.isValidObjectId(userId)) {
        console.error('Google connect got invalid userId:', userId)
        return res.redirect(`${process.env.CLIENT_URL}/calendar?google=error`)
    }

    const client = createOAuthClient()
    const url = client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['openid','email','https://www.googleapis.com/auth/calendar.events'],
        state: userId
    })

    return res.redirect(url)
}

// Step 2: Google sends the user back here
exports.callback = async (req, res) => {
    const { code, state: userId, error } = req.query
    const clientUrl = process.env.CLIENT_URL

    if (!mongoose.isValidObjectId(userId)) {
        console.error('Google callback got invalid userId:', userId)
        return res.redirect(`${clientUrl}/calendar?google=error`)
    }

    try {
        const client = createOAuthClient()
        const { tokens } = await client.getToken(code)

        if (!tokens.refresh_token) {
            return res.redirect(`${clientUrl}/calendar?google=error`)
        }

        // read the user's Google email from the sign-in info Google sent back
        let googleEmail = null
        if (tokens.id_token) {
            const ticket = await client.verifyIdToken({
                idToken: tokens.id_token,
                audience: process.env.GOOGLE_CLIENT_ID
            })
            googleEmail = ticket.getPayload().email
        }

        await GoogleConnection.findOneAndUpdate(
            { user: userId },
            { user: userId, refreshToken: tokens.refresh_token, googleEmail, connectedAt: new Date() },
            { upsert: true, new: true, runValidators: true }
        )

        return res.redirect(`${clientUrl}/calendar?google=connected`)
    } catch (err) {
        console.error('Google callback failed:', err.message)
        return res.redirect(`${clientUrl}/calendar?google=error`)
    }
}

// Check if a user has connected Google Calendar
exports.status = async (req, res) => {
    try {
        // TEMPORARY: replace with the logged-in user once login exists
        const userId = req.query.userId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid user id' })
        }

        const connection = await GoogleConnection.findOne({ user: userId })

        return res.status(200).json({
            connected: !!connection,
            connectedAt: connection ? connection.connectedAt : null,
            googleEmail: connection ? connection.googleEmail : null
        })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// Disconnect Google Calendar
exports.disconnect = async (req, res) => {
    try {
        // TEMPORARY: replace with the logged-in user once login exists
        const userId = req.query.userId
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid user id' })
        }

        const connection = await GoogleConnection.findOne({ user: userId }).select('+refreshToken')
        if (!connection) {
            return res.status(404).json({ message: 'Google Calendar is not connected' })
        }

        // Tell Google to cancel access (still disconnect even if this fails)
        try {
            const client = createOAuthClient()
            await client.revokeToken(connection.refreshToken)
        } catch (err) {
            console.error('Google revoke failed:', err.message)
        }

        await GoogleConnection.deleteOne({ _id: connection._id })

        return res.status(200).json({ message: 'Google Calendar disconnected' })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}