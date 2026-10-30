const GoogleConnection = require('../models/googleConnection');
const Plan = require('../models/plan');
const Notification = require('../models/notification');
const { createOAuthClient } = require('../utils/googleClient');

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
    if (plan.invitees.length) {
        await Notification.insertMany(plan.invitees.map(id => ({
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