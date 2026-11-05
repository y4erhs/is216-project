const mongoose = require('mongoose');
const OpenAI = require('openai');

const Lobby = require('../models/Lobby');
const Event = require('../models/events');
const Activity = require('../models/activity');
const Plan = require('../models/plan');
const googleSync = require('./googleSyncService');

const INTEREST_WEIGHT = 0.6;
const FREE_WEIGHT = 0.4;
const MAX_EVENTS_SENT_TO_AI = 40;
const MAX_RESULTS = 12;
const AI_CACHE_MS = 6 * 60 * 60 * 1000;

// AI interest scores, saved per lobby so reopening the tab doesn't pay for another call.
// Who's free is worked out fresh every time.
const interestCache = new Map();

function makeError(status, message) {
    const err = new Error(message);
    err.status = status;
    return err;
}

// What the AI needs to know about the group (no names), and a fingerprint to spot when it changes
function describeMembers(members, activities) {
    return members.map(m => {
        const attendedTags = activities
            .filter(a => String(a.user) === String(m._id) && a.event && a.sessions.some(s => s.going === 'attended'))
            .flatMap(a => a.event.tags || []);
        return {
            interests: m.interests || [],
            ccas: m.ccas || [],
            notInterestedIn: m.mutedTags || [],
            tagsFromEventsAttended: [...new Set(attendedTags)]
        };
    });
}

// Every time each member is already taken: { memberId: [{ start, end, eventId }] }
async function getBusyTimes(memberIds, activities, from, to) {
    const busy = new Map(memberIds.map(id => [id, []]));
    const add = (memberId, start, end, eventId = null) => {
        const id = String(memberId);
        if (busy.has(id)) busy.get(id).push({ start: new Date(start), end: new Date(end), eventId });
    };

    // Sessions they ticked as attending
    activities.forEach(activity => {
        if (!activity.event) return;   // the event was deleted
        activity.sessions.forEach(entry => {
            if (entry.going !== 'attending') return;
            const session = activity.event.sessions.find(
                s => new Date(s.startTime).getTime() === new Date(entry.startTime).getTime()
            );
            if (session) add(activity.user, session.startTime, session.endTime, String(activity.event._id));
        });
    });

    // Events they're signed up for, same as the shared calendar
    const signedUp = await Event.find({ attendees: { $in: memberIds }, 'sessions.endTime': { $gt: from } })
        .select('attendees sessions');
    signedUp.forEach(event => {
        event.attendees.forEach(attendee => {
            event.sessions.forEach(s => add(attendee, s.startTime, s.endTime, String(event._id)));
        });
    });

    // Plans they made or were invited to, unless they said no
    const plans = await Plan.find({
        $or: [{ creator: { $in: memberIds } }, { invitees: { $in: memberIds } }],
        startTime: { $lt: to },
        endTime: { $gt: from }
    }).select('creator invitees declined startTime endTime');
    plans.forEach(plan => {
        const declined = plan.declined.map(String);
        new Set([plan.creator, ...plan.invitees].map(String)).forEach(memberId => {
            if (!declined.includes(memberId)) add(memberId, plan.startTime, plan.endTime);
        });
    });

    // Google events, only for members who chose to share them
    await Promise.all(memberIds.map(async memberId => {
        try {
            const personal = await googleSync.getPersonalEvents(memberId, from, to);
            personal.forEach(e => add(memberId, e.start, e.end));
        } catch (err) {
            console.error(`Could not read Google events for ${memberId}:`, err.message);
        }
    }));

    return busy;
}

// The session the most members can make (the earliest one if there's a tie)
function bestSession(event, memberIds, busy, now) {
    let best = null;
    const sessions = [...event.sessions]
        .filter(s => new Date(s.startTime) > now)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    for (const session of sessions) {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);
        const freeCount = memberIds.filter(id => !busy.get(id).some(b =>
            b.eventId !== String(event._id) &&   // already going to this event isn't a clash with it
            b.start < end && b.end > start
        )).length;
        if (!best || freeCount > best.freeCount) best = { startTime: start, freeCount };
    }
    return best;
}

// Backup when the AI can't answer: the share of members with an interest in this event's tags
function scoreByTags(event, group) {
    const tags = (event.tags || []).map(t => String(t).toLowerCase());
    const matching = group.filter(m => m.interests.some(i => tags.includes(String(i).toLowerCase()))).length;
    return {
        fit: Math.round((matching / group.length) * 100),
        reason: matching
            ? `Matches the interests of ${matching} of ${group.length} ${group.length === 1 ? 'member' : 'members'}`
            : "Doesn't match anyone's saved interests"
    };
}

async function scoreWithAI(events, group) {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || undefined,
        timeout: 45000,
        maxRetries: 0
    });

    const eventList = events.map(e => ({
        id: String(e._id),
        title: e.title,
        description: (e.description || '').slice(0, 300),
        organiser: e.organiser,
        tags: e.tags
    }));

    const prompt = `You are scoring campus events for a group of university friends choosing one to attend together.
Each entry in "members" is one person in the group.
Members: ${JSON.stringify(group)}
Events: ${JSON.stringify(eventList)}

Give every event a "match" from 0 to 100 for how much this group as a whole would enjoy it.
An event most members would like should beat one that only suits one person.
Use their interests, CCAs and the tags of events they attended, and score down topics in "notInterestedIn".
Judge by what the event is about, not just its tags. Ignore dates and times, as those are checked separately.

Reply with ONLY a JSON object in this exact format:
{"scores": [{"id": "<event id>", "match": <number 0-100>, "reason": "<why it suits this group, under 12 words, no names>"}]}`;

    const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });
    const text = completion.choices[0].message.content.replace(/```json|```/g, '').trim();

    const scores = new Map();
    const known = new Set(eventList.map(e => e.id));
    (JSON.parse(text).scores || []).forEach(s => {
        const match = Number(s.match);
        if (known.has(s.id) && !Number.isNaN(match) && s.reason) {
            scores.set(s.id, { fit: Math.max(0, Math.min(100, Math.round(match))), reason: String(s.reason) });
        }
    });
    return scores;
}

// Saved scores where possible; the AI only sees events that don't have one yet
async function getInterestScores(lobbyId, events, group) {
    const fingerprint = JSON.stringify(group);
    let saved = interestCache.get(lobbyId);
    if (!saved || saved.fingerprint !== fingerprint || Date.now() - saved.at > AI_CACHE_MS) {
        saved = { fingerprint, at: Date.now(), scores: new Map() };
        interestCache.set(lobbyId, saved);
    }

    const missing = events.filter(e => !saved.scores.has(String(e._id))).slice(0, MAX_EVENTS_SENT_TO_AI);
    if (missing.length) {
        try {
            const fresh = await scoreWithAI(missing, group);
            fresh.forEach((value, id) => saved.scores.set(id, value));
        } catch (err) {
            console.error('Group recommendations fell back to tags:', err.message);
        }
    }

    // Anything still unscored uses tags for now, and isn't saved so the AI can try again next time
    return new Map(events.map(e => {
        const id = String(e._id);
        return [id, saved.scores.get(id) || scoreByTags(e, group)];
    }));
}

exports.recommendForLobby = async (lobbyId, userId) => {
    if (!mongoose.isValidObjectId(lobbyId)) throw makeError(400, 'Invalid lobby id');

    const memberFields = 'interests ccas mutedTags';
    const lobby = await Lobby.findById(lobbyId)
        .populate('host', memberFields)
        .populate('participants', memberFields);
    if (!lobby) throw makeError(404, 'Lobby not found');

    // Host + accepted members, same people as the shared calendar
    const byId = new Map();
    [lobby.host, ...lobby.participants].forEach(m => { if (m) byId.set(String(m._id), m); });
    if (!byId.has(String(userId))) throw makeError(403, 'You are not a member of this lobby');
    const members = [...byId.values()];
    const memberIds = [...byId.keys()];

    const now = new Date();
    const registered = new Set(lobby.history.map(h => String(h.eventId)));
    const events = (await Event.find({
        'sessions.startTime': { $gt: now },
        status: { $nin: ['pending', 'rejected'] }
    })).filter(e => !registered.has(String(e._id)) && !(e.slots != null && e.signUpCount >= e.slots));
    if (!events.length) return { memberCount: members.length, recommendations: [] };

    const latestEnd = new Date(Math.max(...events.flatMap(e => e.sessions.map(s => new Date(s.endTime).getTime()))));
    const activities = await Activity.find({ user: { $in: memberIds }, 'sessions.0': { $exists: true } }).populate('event');
    const busy = await getBusyTimes(memberIds, activities, now, latestEnd);

    // Events nobody can make aren't worth asking the AI about
    const reachable = events
        .map(event => ({ event, session: bestSession(event, memberIds, busy, now) }))
        .filter(({ session }) => session && session.freeCount > 0)
        .sort((a, b) => b.session.freeCount - a.session.freeCount || a.session.startTime - b.session.startTime);

    const group = describeMembers(members, activities);
    const interestScores = await getInterestScores(
        String(lobby._id),
        reachable.map(r => r.event),
        group
    );

    const recommendations = reachable.map(({ event, session }) => {
        const { fit, reason } = interestScores.get(String(event._id));
        const freePercent = (session.freeCount / members.length) * 100;
        return {
            eventId: String(event._id),
            score: Math.round(fit * INTEREST_WEIGHT + freePercent * FREE_WEIGHT),
            interestFit: fit,
            freeCount: session.freeCount,
            sessionStart: session.startTime,
            reason
        };
    })
        .sort((a, b) => b.score - a.score || new Date(a.sessionStart) - new Date(b.sessionStart))
        .slice(0, MAX_RESULTS);

    return { memberCount: members.length, recommendations };
};
