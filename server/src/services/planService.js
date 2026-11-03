const mongoose = require('mongoose');
const Plan = require('../models/plan');
const User = require('../models/user');
const Friends = require('../models/friends');
const GoogleConnection = require('../models/googleConnection');
const Notification = require('../models/notification');
const { createOAuthClient } = require('../utils/googleClient');
const Lobby = require('../models/Lobby');

const TIME_ZONE = 'Asia/Singapore';
const ONE_DAY = 24 * 60 * 60 * 1000;

function badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

function withStatus(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

// All-day: start/end are "YYYY-MM-DD". Timed: start/end are ISO date-times.
function parseTimes(allDay, start, end) {
    const startTime = allDay ? new Date(`${start}T00:00:00+08:00`) : new Date(start);
    const endTime   = allDay ? new Date(`${end || start}T23:59:59+08:00`) : new Date(end);
    if (isNaN(startTime) || isNaN(endTime)) throw badRequest('Invalid start or end time');
    if (endTime < startTime) throw badRequest('End time must be after start time');
    return { startTime, endTime };
}

// Google's format for a plan's start and end
function googleTimes(plan) {
    return {
        start: plan.allDay
            ? { date: toSgDate(plan.startTime) }
            : { dateTime: plan.startTime.toISOString(), timeZone: TIME_ZONE },
        end: plan.allDay
            ? { date: toSgDate(new Date(plan.endTime.getTime() + ONE_DAY)) }   // Google's all-day end date is the day AFTER
            : { dateTime: plan.endTime.toISOString(), timeZone: TIME_ZONE }
    };
}

// A Google client for this user, or null if they haven't linked Google
async function getGoogleClient(userId) {
    const connection = await GoogleConnection.findOne({ user: userId }).select('+refreshToken');
    if (!connection) return null;
    const client = createOAuthClient();
    client.setCredentials({ refresh_token: connection.refreshToken });
    return client;
}

// In-app notification to each person in the list who has plan alerts on
async function notifyUsers(userIds, type, title, message, planId, fromUserId) {
    const wanted = await User.idsWantingAlert(userIds, 'plans');
    if (!wanted.length) return null;
    return Notification.insertMany(wanted.map(id => ({
        userId: id,
        type,
        title,
        message,
        channels: ['in_app'],
        status: 'sent',
        sentAt: new Date(),
        metadata: { planId, fromUserId }
    })));
}

async function findPlan(planId) {
    if (!mongoose.isValidObjectId(planId)) throw badRequest('Invalid plan id');
    const plan = await Plan.findById(planId);
    if (!plan) throw withStatus(404, 'Plan not found');
    return plan;
}

// Only the person who made a plan can change it
async function findOwnPlan(planId, userId) {
    const plan = await findPlan(planId);
    if (String(plan.creator) !== String(userId)) {
        throw withStatus(403, 'Only the person who made this plan can change it');
    }
    return plan;
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
    const client = await getGoogleClient(creatorId);
    if (!client) {
        return { eventId: null, warning: 'Google Calendar not connected, so the plan was only saved in the app' };
    }

    const { start, end } = googleTimes(plan);

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

exports.createPlan = async ({ userId, title, allDay = false, start, end, location = '', description = '', inviteeIds = [], lobbyId = null }) => {
    if (!mongoose.isValidObjectId(userId)) throw badRequest('Invalid user id');
    if (!title || !title.trim()) throw badRequest('Title is required');

    const creator = await User.findById(userId);
    if (!creator) throw badRequest('User not found');

    const { startTime, endTime } = parseTimes(allDay, start, end);

    // Only accepted friends can be invited
        let uniqueIds;
        let lobby = null;

        if (lobbyId) {
            // Lobby plan: invite every other lobby member, no friend check
            if (!mongoose.isValidObjectId(lobbyId)) throw badRequest('Invalid lobby id');

            lobby = await Lobby.findById(lobbyId);
            if (!lobby) {
                const err = new Error('Lobby not found');
                err.status = 404;
                throw err;
            }

            const memberIds = [...new Set([String(lobby.host), ...lobby.participants.map(String)])];
            if (!memberIds.includes(String(userId))) {
                const err = new Error('You are not a member of this lobby');
                err.status = 403;
                throw err;
            }

            uniqueIds = memberIds.filter(id => id !== String(userId));
        } else {
            // Normal plan: only accepted friends can be invited
            uniqueIds = [...new Set(inviteeIds.map(String))];
            const friendIds = await getFriendIds(userId);
            if (uniqueIds.some(id => !friendIds.includes(id))) throw badRequest('You can only invite your friends');
        }

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
        invitees: invitees.map(u => u._id),
        lobby: lobby ? lobby._id : null
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
        await notifyUsers(
            invitees.map(u => u._id),
            'plan_invite',
            'New plan invite',
            lobby ? `${creatorName} added "${plan.title}" to ${lobby.name}` : `${creatorName} invited you to "${plan.title}"`,
            plan._id,
            creator._id
        );
    }

    return { plan, warning };
};

// Upcoming plans this user made or was invited to, soonest first
exports.listPlans = async (userId) => {
    if (!mongoose.isValidObjectId(userId)) throw badRequest('Invalid user id');

    return Plan.find({
        $or: [{ creator: userId }, { invitees: userId }],
        endTime: { $gt: new Date() }
    })
        .populate('creator', 'username displayName')
        .populate('lobby', 'name')
        .sort({ startTime: 1 });
};

exports.updatePlan = async (planId, { userId, title, allDay = false, start, end, location = '', description = '' }) => {
    const plan = await findOwnPlan(planId, userId);
    if (!title || !title.trim()) throw badRequest('Title is required');

    const { startTime, endTime } = parseTimes(allDay, start, end);
    const timeChanged = startTime.getTime() !== plan.startTime.getTime() || endTime.getTime() !== plan.endTime.getTime();

    plan.set({ title: title.trim(), allDay, startTime, endTime, location, description });
    // A new time might not suit people any more, so they reply again
    if (timeChanged) plan.set({ accepted: [], declined: [] });
    await plan.save();

    let warning = null;
    if (plan.googleEventId) {
        try {
            const client = await getGoogleClient(userId);
            if (client) {
                await client.request({
                    url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${plan.googleEventId}`,
                    method: 'PATCH',
                    params: { sendUpdates: 'all' },
                    data: { summary: plan.title, location, description, ...googleTimes(plan) }
                });
            }
        } catch (err) {
            console.error('Google event update failed:', err.message);
            warning = 'Plan saved, but updating it in Google Calendar failed';
        }
    }

    await notifyUsers(
        plan.invitees,
        'plan_updated',
        'Plan updated',
        timeChanged ? `"${plan.title}" has a new time. Please reply again.` : `"${plan.title}" was updated`,
        plan._id,
        plan.creator
    );

    return { plan, warning };
};

exports.deletePlan = async (planId, userId) => {
    const plan = await findOwnPlan(planId, userId);

    let warning = null;
    if (plan.googleEventId) {
        try {
            const client = await getGoogleClient(userId);
            if (client) {
                await client.request({
                    url: `https://www.googleapis.com/calendar/v3/calendars/primary/events/${plan.googleEventId}`,
                    method: 'DELETE',
                    params: { sendUpdates: 'all' }
                });
            }
        } catch (err) {
            const status = err.response?.status;
            if (status !== 404 && status !== 410) {   // otherwise it's already gone from Google
                console.error('Google event delete failed:', err.message);
                warning = 'Plan deleted, but removing it from Google Calendar failed, so delete it there too';
            }
        }
    }

    await notifyUsers(plan.invitees, 'plan_cancelled', 'Plan cancelled', `"${plan.title}" has been cancelled`, plan._id, plan.creator);
    await Plan.deleteOne({ _id: plan._id });

    return { warning };
};

exports.respondToPlan = async (planId, { userId, response }) => {
    if (!['accepted', 'declined'].includes(response)) throw badRequest('Response must be accepted or declined');

    const plan = await findPlan(planId);
    if (!plan.invitees.some(id => String(id) === String(userId))) {
        throw withStatus(403, 'You are not invited to this plan');
    }

    const other = response === 'accepted' ? 'declined' : 'accepted';
    const alreadySame = plan[response].some(id => String(id) === String(userId));
    plan[other].pull(userId);
    if (!alreadySame) plan[response].push(userId);
    await plan.save();

    if (!alreadySame) {
        const user = await User.findById(userId).select('username displayName');
        const name = user?.displayName || user?.username || 'Someone';
        await notifyUsers(
            [plan.creator],
            'plan_response',
            'Plan reply',
            `${name} ${response} your plan "${plan.title}"`,
            plan._id,
            userId
        );
    }

    return plan;
};
