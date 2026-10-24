const { google } = require('googleapis')
const { createOAuthClient } = require('../utils/googleClient')
const GoogleConnection = require('../models/googleConnection')

// Gets a Google Calendar helper for this user, or null if they haven't connected
async function getCalendar(userId) {
    const connection = await GoogleConnection.findOne({ user: userId }).select('+refreshToken')
    if (!connection) {
        return null
    }

    const auth = createOAuthClient()
    auth.setCredentials({ refresh_token: connection.refreshToken })
    return google.calendar({ version: 'v3', auth })
}

// If Google says the connection is no longer valid, remove it so the user can reconnect
async function handleGoogleError(userId, err) {
    const isExpired =
        err.response?.data?.error === 'invalid_grant' ||
        err.message?.includes('invalid_grant')

    if (isExpired) {
        await GoogleConnection.deleteOne({ user: userId })
        console.warn(`Google connection expired for user ${userId}, removed it`)
        return
    }

    throw err
}

// Adds one session and returns Google's event ID (or null if not connected)
exports.addSessionToGoogle = async (userId, event, session) => {
    const calendar = await getCalendar(userId)
    if (!calendar) {
        return null
    }

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: {
                summary: event.title,
                description: event.description,
                location: event.venue,
                start: { dateTime: new Date(session.startTime).toISOString(), timeZone: 'Asia/Singapore' },
                end: { dateTime: new Date(session.endTime).toISOString(), timeZone: 'Asia/Singapore' }
            }
        })
        return response.data.id
    } catch (err) {
        await handleGoogleError(userId, err)
        return null
    }
}

// Removes a list of Google events
exports.removeFromGoogleCalendar = async (userId, googleEventIds) => {
    if (!googleEventIds || googleEventIds.length === 0) {
        return
    }

    const calendar = await getCalendar(userId)
    if (!calendar) {
        return
    }

    for (const id of googleEventIds) {
        try {
            await calendar.events.delete({ calendarId: 'primary', eventId: id })
        } catch (err) {
            // 404/410 means the user already deleted it in Google, so that's fine
            if (err.code === 404 || err.code === 410) {
                continue
            }
            await handleGoogleError(userId, err)
            return
        }
    }
}