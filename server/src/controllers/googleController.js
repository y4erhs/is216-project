const { createOAuthClient } = require('../utils/googleClient')
const GoogleConnection = require('../models/googleConnection')
const GoogleSignInCode = require('../models/googleSignInCode')
const User = require('../models/user')
const { signLoginToken, signGoogleLinkState, readGoogleLinkState } = require('../middleware/authCheck')
const crypto = require('crypto')

const SMU_DOMAIN = 'smu.edu.sg'
const TEN_MINUTES = 10 * 60 * 1000
const THIRTY_MINUTES = 30 * 60 * 1000

// Where Google sends people back after signing in (different from linking a calendar)
function signInRedirectUri() {
    return process.env.GOOGLE_SIGNIN_REDIRECT_URI
        || process.env.GOOGLE_REDIRECT_URI.replace(/\/callback$/, '/signin/callback')
}

function newCode(fields, lifetime) {
    return GoogleSignInCode.create({
        ...fields,
        code: crypto.randomBytes(32).toString('hex'),
        expiresAt: new Date(Date.now() + lifetime)
    })
}

// Step 1: give the browser the link to Google's permission screen
exports.connect = (req, res) => {
    const client = createOAuthClient()
    const url = client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['openid','email','https://www.googleapis.com/auth/calendar.events'],
        state: signGoogleLinkState(req.user.id)
    })

    return res.status(200).json({ url })
}

// Step 2: Google sends the user back here
exports.callback = async (req, res) => {
    const { code, state } = req.query
    const clientUrl = process.env.CLIENT_URL

    let userId
    try {
        userId = readGoogleLinkState(state)
    } catch (err) {
        console.error('Google callback got an invalid state:', err.message)
        return res.redirect(`${clientUrl}/profile?google=error`)
    }

    try {
        const client = createOAuthClient()
        const { tokens } = await client.getToken(code)

        if (!tokens.refresh_token) {
            return res.redirect(`${clientUrl}/profile?google=error`)
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

        return res.redirect(`${clientUrl}/profile?google=connected`)
    } catch (err) {
        console.error('Google callback failed:', err.message)
        return res.redirect(`${clientUrl}/profile?google=error`)
    }
}

// Check if a user has connected Google Calendar
exports.status = async (req, res) => {
    try {
        const userId = req.user.id

        const connection = await GoogleConnection.findOne({ user: userId })

        return res.status(200).json({
            connected: !!connection,
            connectedAt: connection ? connection.connectedAt : null,
            googleEmail: connection ? connection.googleEmail : null,
            includePersonal: connection ? connection.includePersonal : false
        })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// Disconnect Google Calendar
exports.disconnect = async (req, res) => {
    try {
        const userId = req.user.id

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

// Turn "Include personal commitments" on or off
exports.updateSettings = async (req, res) => {
    try {
        const userId = req.user.id

        const connection = await GoogleConnection.findOneAndUpdate(
            { user: userId },
            { includePersonal: Boolean(req.body.includePersonal) },
            { new: true }
        )
        if (!connection) {
            return res.status(404).json({ message: 'Google Calendar is not connected' })
        }

        return res.status(200).json({ includePersonal: connection.includePersonal })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// --- Continue with Google (signing in, not linking a calendar) ---

// Step 1: send the user to Google, suggesting their SMU account
exports.signInStart = async (req, res) => {
    try {
        const { code: state } = await newCode({ kind: 'state' }, TEN_MINUTES)
        const url = createOAuthClient().generateAuthUrl({
            redirect_uri: signInRedirectUri(),
            scope: ['openid', 'email', 'profile'],
            prompt: 'select_account',
            hd: SMU_DOMAIN,   // only a hint: the real check is in signInCallback
            state
        })
        return res.redirect(url)
    } catch (err) {
        console.error('Google sign-in failed to start:', err.message)
        return res.redirect(`${process.env.CLIENT_URL}/login?googleError=failed`)
    }
}

// Step 2: Google sends them back. Check the account, then hand the browser a one-time code.
exports.signInCallback = async (req, res) => {
    const clientUrl = process.env.CLIENT_URL
    const { code, state, error } = req.query

    if (error || !code) return res.redirect(`${clientUrl}/login?googleError=cancelled`)

    try {
        const validState = await GoogleSignInCode.findOneAndDelete({
            code: String(state), kind: 'state', expiresAt: { $gt: new Date() }
        })
        if (!validState) return res.redirect(`${clientUrl}/login?googleError=failed`)

        const client = createOAuthClient()
        const { tokens } = await client.getToken({ code, redirect_uri: signInRedirectUri() })
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_CLIENT_ID
        })
        const { email, email_verified: verified, name } = ticket.getPayload()
        const cleanEmail = String(email || '').toLowerCase()

        if (!verified || !cleanEmail.endsWith(`@${SMU_DOMAIN}`)) {
            return res.redirect(`${clientUrl}/login?googleError=not_smu`)
        }

        const user = await User.findOne({ email: cleanEmail }).collation({ locale: 'en', strength: 2 })
        if (user) {
            const { code: loginCode } = await newCode({ kind: 'login', user: user._id }, TEN_MINUTES)
            return res.redirect(`${clientUrl}/login?googleCode=${loginCode}`)
        }

        // New person: they still need to pick a username, course, year and interests
        const { code: signupCode } = await newCode({ kind: 'signup', email: cleanEmail, name: name || '' }, THIRTY_MINUTES)
        return res.redirect(`${clientUrl}/signup?googleCode=${signupCode}`)
    } catch (err) {
        console.error('Google sign-in failed:', err.message)
        return res.redirect(`${clientUrl}/login?googleError=failed`)
    }
}

// Step 3 (existing user): swap the one-time code for the logged-in user
exports.signInExchange = async (req, res) => {
    try {
        const found = await GoogleSignInCode.findOneAndDelete({
            code: String(req.body.code), kind: 'login', expiresAt: { $gt: new Date() }
        })
        if (!found) return res.status(400).json({ message: 'That sign-in link has expired. Please try again.' })

        const user = await User.findById(found.user).select('-password')
        if (!user) return res.status(404).json({ message: 'User not found' })

        return res.status(200).json({ message: 'Login successful', user, token: signLoginToken(user._id) })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// Step 3 (new user): the details Google gave us, to start the signup form
exports.signInSignupInfo = async (req, res) => {
    try {
        const found = await GoogleSignInCode.findOne({
            code: String(req.query.code), kind: 'signup', expiresAt: { $gt: new Date() }
        })
        if (!found) return res.status(400).json({ message: 'That sign-up link has expired. Please try again.' })

        return res.status(200).json({ email: found.email, name: found.name })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}
