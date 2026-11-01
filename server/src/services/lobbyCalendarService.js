const mongoose = require('mongoose');
const Lobby = require('../models/Lobby');
const Event = require('../models/events');
const Plan = require('../models/plan');
const PlannerEvent = require('../models/plannerEvent');

// Makes an error that also carries an HTTP status code
function makeError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

// "2026-11" -> start of Nov 1 to start of Dec 1
function getMonthRange(month) {
    const [year, mon] = month.split('-').map(Number);
    return {
        start: new Date(year, mon - 1, 1),
        end: new Date(year, mon, 1)
    };
}

async function getLobbyCalendar(lobbyId, userId, month) {
    // 1. Check inputs, load lobby, check membership
    if (!mongoose.Types.ObjectId.isValid(lobbyId)) {
        throw makeError(400, 'Invalid lobby id');
    }
    if (!/^\d{4}-\d{2}$/.test(month || '')) {
        throw makeError(400, 'month must look like 2026-11');
    }

    const lobby = await Lobby.findById(lobbyId)
        .populate('host', 'username')
        .populate('participants', 'username');

    if (!lobby) throw makeError(404, 'Lobby not found');

    // Members = host + participants (id -> username)
    const memberMap = new Map();
    if (lobby.host) memberMap.set(lobby.host._id.toString(), lobby.host.username);
    lobby.participants.forEach(p => {
        if (p) memberMap.set(p._id.toString(), p.username);
    });

    if (!memberMap.has(String(userId))) {
        throw makeError(403, 'You are not a member of this lobby');
    }
    const memberIds = [...memberMap.keys()];

    // 2. Month range
    const { start, end } = getMonthRange(month);
    const hasSessionInMonth = {
        $elemMatch: { startTime: { $lt: end }, endTime: { $gt: start } }
    };
    const sessionInMonth = s => s.startTime < end && s.endTime > start;

    const items = [];

    // 3. Lobby events (from history), one item per session
    const lobbyEventIds = lobby.history.map(h => h.eventId).filter(Boolean);
    const lobbyEventIdSet = new Set(lobbyEventIds.map(id => id.toString()));

    const lobbyEvents = await Event.find({
        _id: { $in: lobbyEventIds },
        sessions: hasSessionInMonth
    });

    lobbyEvents.forEach(event => {
        event.sessions.filter(sessionInMonth).forEach(s => {
            items.push({
                type: 'lobby',
                title: event.title,
                start: s.startTime,
                end: s.endTime,
                venue: event.venue,
                eventId: event._id
            });
        });
    });

    // 4. Lobby plans
    const lobbyPlans = await Plan.find({
        lobby: lobby._id,
        startTime: { $lt: end },
        endTime: { $gt: start }
    });

    lobbyPlans.forEach(p => {
        items.push({
            type: 'plan',
            title: p.title,
            start: p.startTime,
            end: p.endTime,
            allDay: p.allDay,
            location: p.location,
            planId: p._id
        });
    });

    // 5. Members' own events (from Event.attendees AND PlannerEvent)
    const seen = new Set(); // "memberId:eventId" so nothing shows twice

    function addMemberEvent(memberId, event) {
        const key = memberId + ':' + event._id.toString();
        if (seen.has(key)) return;
        seen.add(key);

        event.sessions.filter(sessionInMonth).forEach(s => {
            items.push({
                type: 'member',
                memberId,
                title: event.title,
                start: s.startTime,
                end: s.endTime,
                eventId: event._id
            });
        });
    }

    const attendedEvents = await Event.find({
        _id: { $nin: lobbyEventIds },
        attendees: { $in: memberIds },
        sessions: hasSessionInMonth
    });

    attendedEvents.forEach(event => {
        event.attendees.forEach(a => {
            const id = a.toString();
            if (memberMap.has(id)) addMemberEvent(id, event);
        });
    });

    const plannerEntries = await PlannerEvent.find({
        user: { $in: memberIds },
        status: 'attending'
    }).populate('event');

    plannerEntries.forEach(pe => {
        if (!pe.event) return; // event was deleted
        if (lobbyEventIdSet.has(pe.event._id.toString())) return;
        addMemberEvent(pe.user.toString(), pe.event);
    });

    // 6. Members' other plans, shown only as "Busy"
    const otherPlans = await Plan.find({
        lobby: { $ne: lobby._id },
        $or: [
            { creator: { $in: memberIds } },
            { invitees: { $in: memberIds } }
        ],
        startTime: { $lt: end },
        endTime: { $gt: start }
    });

    otherPlans.forEach(p => {
        const involved = new Set(
            [p.creator, ...p.invitees].map(String).filter(id => memberMap.has(id))
        );
        involved.forEach(memberId => {
            items.push({
                type: 'busy',
                memberId,
                title: 'Busy',
                start: p.startTime,
                end: p.endTime,
                allDay: p.allDay
            });
        });
    });

    // 7. Sort and return
    items.sort((a, b) => new Date(a.start) - new Date(b.start));

    return {
        lobbyId: lobby._id,
        month,
        members: memberIds.map(id => ({ id, username: memberMap.get(id) })),
        items
    };
}

module.exports = { getLobbyCalendar };