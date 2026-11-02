const GoogleConnection = require('../models/googleConnection');
const Plan = require('../models/plan');
const Notification = require('../models/notification');
const User = require('../models/user');
const Activity = require('../models/activity');
const { createOAuthClient } = require('../utils/googleClient');
const { addSessionToGoogle } = require('./googleCalendarService');

const CAL_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

// Returns a Google client for this user, or null if they haven't linked Google
async function getClientForUser(userId) {
    const connection = await GoogleConnection.findOne({ user: userId }).select('+refreshToken');
    if (!connection) return null;
    const client = createOAuthClient();
    client.setCredentials({ refresh_token: connection.refreshToken });
    return client;
}

// Google gives a date-time for timed events, or a date for all-day ones
// (for all-day, Google's end date is the day AFTER, so we step back 1 second)
function fromGoogleTimes(event) {
    if (event.start.date) {
        return {
            allDay: true,
            startTime: new Date(`${event.start.date}T00:00:00+08:00`),
            endTime: new Date(new Date(`${event.end.date}T00:00:00+08:00`).getTime() - 1000)
        };
    }
    return {
        allDay: false,
        startTime: new Date(event.start.dateTime),
        endTime: new Date(event.end.dateTime)
    };
}

// Deletes the plan and tells invited friends
async function cancelPlan(plan) {
    const wanted = await User.idsWantingAlert(plan.invitees, 'plans');
    if (wanted.length) {
        await Notification.insertMany(wanted.map(id => ({
            userId: id,
            type: 'plan_cancelled',
            title: 'Plan cancelled',
            message: `"${plan.title}" has been cancelled`,
            channels: ['in_app'],
            status: 'sent',
            sentAt: new Date(),
            metadata: { planId: plan._id }
        })));
    }
    await Plan.deleteOne({ _id: plan._id });
}

// Makes this user's upcoming plans match Google
exports.syncPlans = async (userId) => {
    const result = { checked: 0, updated: 0, deleted: 0 };

    const plans = await Plan.find({
        $or: [{ creator: userId }, { invitees: userId }],
        googleEventId: { $ne: null },
        endTime: { $gt: new Date() }
    });

    const clients = new Map();   // reuse one Google client per plan creator

    for (const plan of plans) {
        const creatorId = String(plan.creator);
        if (!clients.has(creatorId)) clients.set(creatorId, await getClientForUser(creatorId));
        const client = clients.get(creatorId);
        if (!client) continue;   // creator unlinked Google, so we can't check

        result.checked++;

        let event;
        try {
            const res = await client.request({ url: `${CAL_URL}/${plan.googleEventId}` });
            event = res.data;
        } catch (err) {
            const status = err.response?.status;
            if (status === 404 || status === 410) {   // event no longer exists
                await cancelPlan(plan);
                result.deleted++;
            } else {
                console.error(`Sync failed for plan ${plan._id}:`, err.message);
            }
            continue;
        }

        if (event.status === 'cancelled') {   // deleted in Google
            await cancelPlan(plan);
            result.deleted++;
            continue;
        }

        // Copy any changes made in Google
        const updates = {
            title: event.summary || plan.title,
            location: event.location || '',
            description: event.description || '',
            ...fromGoogleTimes(event)
        };

        const changed =
            updates.title !== plan.title ||
            updates.location !== plan.location ||
            updates.description !== plan.description ||
            updates.allDay !== plan.allDay ||
            updates.startTime.getTime() !== plan.startTime.getTime() ||
            updates.endTime.getTime() !== plan.endTime.getTime();

        if (changed) {
            Object.assign(plan, updates);
            await plan.save();
            result.updated++;
        }
    }

    return result;
};

// Puts every upcoming session the user is attending into their Google Calendar.
// Re-adds ones that were never added, or whose Google event is gone
// (deleted, or added to a Google account that's no longer linked).
exports.syncAttending = async (userId) => {
    const result = { added: 0 };

    const client = await getClientForUser(userId);
    if (!client) return result;   // Google not linked

    const activities = await Activity.find({ user: userId, 'sessions.going': 'attending' }).populate('event');
    const now = new Date();

    for (const activity of activities) {
        if (!activity.event) continue;   // event was deleted

        for (const entry of activity.sessions) {
            if (entry.going !== 'attending') continue;

            const session = activity.event.sessions.find(
                s => new Date(s.startTime).getTime() === new Date(entry.startTime).getTime()
            );
            if (!session || new Date(session.endTime) < now) continue;   // gone or already over

            // already in Google? then leave it
            if (entry.googleEventId) {
                try {
                    const res = await client.request({ url: `${CAL_URL}/${entry.googleEventId}` });
                    if (res.data.status !== 'cancelled') continue;
                } catch (err) {
                    const status = err.response?.status;
                    if (status !== 404 && status !== 410) {   // network hiccup etc, try next time
                        console.error(`Attending sync failed for activity ${activity._id}:`, err.message);
                        continue;
                    }
                }
            }

            // If the calendar already has this exact event (same title and start), reuse it instead of adding a copy
            const start = new Date(session.startTime);
            let googleEventId = null;
            try {
                const res = await client.request({
                    url: CAL_URL,
                    params: { timeMin: start.toISOString(), timeMax: new Date(start.getTime() + 1000).toISOString(), singleEvents: true }
                });
                const match = (res.data.items || []).find(e =>
                    e.summary === activity.event.title &&
                    new Date(e.start?.dateTime).getTime() === start.getTime()
                );
                googleEventId = match?.id || null;
            } catch (err) {
                console.error(`Could not look for an existing Google event for activity ${activity._id}:`, err.message);
            }

            if (!googleEventId) googleEventId = await addSessionToGoogle(userId, activity.event, session);
            if (!googleEventId) continue;

            await Activity.updateOne(
                { _id: activity._id, 'sessions.startTime': entry.startTime },
                { $set: { 'sessions.$.googleEventId': googleEventId } }
            );
            result.added++;
        }
    }

    return result;
};

// The user's own Google events between two dates (only if the toggle is on)
exports.getPersonalEvents = async (userId, from, to) => {
    const connection = await GoogleConnection.findOne({ user: userId });
    if (!connection || !connection.includePersonal) return [];

    const client = await getClientForUser(userId);

    // Skip events that are already our plans, so they aren't counted twice
    const myPlans = await Plan.find({
        $or: [{ creator: userId }, { invitees: userId }],
        googleEventId: { $ne: null }
    }).select('googleEventId');
    const planEventIds = new Set(myPlans.map(p => p.googleEventId));

    const res = await client.request({
        url: CAL_URL,
        params: {
            timeMin: from.toISOString(),
            timeMax: to.toISOString(),
            singleEvents: true,   // expands repeating events like weekly classes
            orderBy: 'startTime',
            maxResults: 250
        }
    });

    return (res.data.items || [])
        .filter(e => e.start?.dateTime && e.end?.dateTime)   // skip all-day events
        .filter(e => !planEventIds.has(e.id))
        .filter(e => !(e.attendees || []).some(a => a.self && a.responseStatus === 'declined'))
        .map(e => ({
            kind: 'google',
            id: e.id,
            title: e.summary || '(No title)',
            status: 'personal',
            start: new Date(e.start.dateTime),
            end: new Date(e.end.dateTime)
        }));
};