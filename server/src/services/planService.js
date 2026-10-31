const mongoose = require('mongoose');
const Plan = require('../models/plan');
const User = require('../models/user');
const Friends = require('../models/friends');
const GoogleConnection = require('../models/googleConnection');
const Notification = require('../models/notification');
const { createOAuthClient } = require('../utils/googleClient');

const TIME_ZONE = 'Asia/Singapore';
const ONE_DAY = 24 * 60 * 60 * 1000;

function badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

// Gives "2026-10-30" for a date, in Singapore time
function toSgDate(date) {
    return date.toLocaleDateString('en-CA', { timeZone: TIME_ZONE });
}

// Returns the ids of this user's accepted friends
async function getFriendIds(userId) {
    const friends = await Friends.getAcceptedFriends(userId);
    return friends.map(f => {
        const a = f.requester || f.requesterId;
        const b = f.receiver || f.receiverId;
        if (a && b) {
            // friend record stores both people: pick the one that isn't this user
            const aId = String(a._id || a);
            const bId = String(b._id || b);
            return aId === String(userId) ? bId : aId;
        }
        return String(f._id);   // already a list of user objects
    });
}

async function createGoogleEvent(creatorId, plan, attendeeEmails) {
    const connection = await GoogleConnection.findOne({ user: creatorId }).select('+refreshToken');
    if (!connection) {
        return { eventId: null, warning: 'Google Calendar not connected, so the plan was only saved in the app' };
    }

    const client = createOAuthClient();
    client.setCredentials({ refresh_token: connection.refreshToken });

    const start = plan.allDay
        ? { date: toSgDate(plan.startTime) }
        : { dateTime: plan.startTime.toISOString(), timeZone: TIME_ZONE };
    const end = plan.allDay
        ? { date: toSgDate(new Date(plan.endTime.getTime() + ONE_DAY)) }   // Google's all-day end date is the day AFTER
        : { dateTime: plan.endTime.toISOString(), timeZone: TIME_ZONE };

    const res = await client.request({
        url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        method: 'POST',
        params: { sendUpdates: 'all' },   // emails invites to attendees
        data: {
            summary: plan.title,
            location: plan.location,
            description: plan.description,
            start,
            end,
            attendees: attendeeEmails.map(email => ({ email }))
        }
    });

    return { eventId: res.data.id, warning: null };
}

exports.createPlan = async ({ userId, title, allDay = false, start, end, location = '', description = '', inviteeIds = [] }) => {
    if (!mongoose.isValidObjectId(userId)) throw badRequest('Invalid user id');
    if (!title || !title.trim()) throw badRequest('Title is required');

    const creator = await User.findById(userId);
    if (!creator) throw badRequest('User not found');

    // All-day: start/end are "YYYY-MM-DD". Timed: start/end are ISO date-times.
    const startTime = allDay ? new Date(`${start}T00:00:00+08:00`) : new Date(start);
    const endTime   = allDay ? new Date(`${end || start}T23:59:59+08:00`) : new Date(end);
    if (isNaN(startTime) || isNaN(endTime)) throw badRequest('Invalid start or end time');
    if (endTime < startTime) throw badRequest('End time must be after start time');

    // Only accepted friends can be invited
    const uniqueIds = [...new Set(inviteeIds.map(String))];
    const friendIds = await getFriendIds(userId);
    if (uniqueIds.some(id => !friendIds.includes(id))) throw badRequest('You can only invite your friends');

    // Use each friend's linked Google email if they have one, otherwise their account email
    const invitees = await User.find({ _id: { $in: uniqueIds } }).select('email');
    const connections = await GoogleConnection.find({ user: { $in: uniqueIds } }).select('user googleEmail');
    const googleEmailByUser = new Map(connections.map(c => [String(c.user), c.googleEmail]));
    const emails = invitees.map(u => googleEmailByUser.get(String(u._id)) || u.email);

    // Save in our database first, so the plan exists even if Google fails
    const plan = await Plan.create({
        creator: userId,
        title: title.trim(),
        allDay,
        startTime,
        endTime,
        location,
        description,
        invitees: invitees.map(u => u._id)
    });

    let warning = null;
    try {
        const result = await createGoogleEvent(userId, plan, emails);
        warning = result.warning;
        if (result.eventId) {
            plan.googleEventId = result.eventId;
            await plan.save();
        }
    } catch (err) {
        console.error('Google event creation failed:', err.message);
        warning = 'Plan saved, but adding it to Google Calendar failed';
    }

    // In-app invite for each friend
    if (invitees.length) {
        const creatorName = creator.displayName || creator.fullName || creator.username;
        await Notification.insertMany(invitees.map(u => ({
            userId: u._id,
            type: 'plan_invite',
            title: 'New plan invite',
            message: `${creatorName} invited you to "${plan.title}"`,
            channels: ['in_app'],
            status: 'sent',
            sentAt: new Date(),
            metadata: { planId: plan._id }
        })));
    }

    return { plan, warning };
};