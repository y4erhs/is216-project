const mongoose = require('mongoose');
const PlannerEvent = require('../models/plannerEvent');
const Plan = require('../models/plan');
const googleSync = require('./googleSyncService');

const TIGHT_GAP_MINUTES = 15;   // a gap shorter than this counts as "tight"
const DAYS_AHEAD = 7;

function badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

exports.getConflicts = async (userId) => {
    if (!mongoose.isValidObjectId(userId)) throw badRequest('Invalid user id');

    // Bring plans up to date with Google first (alerts still load if this fails)
    try {
        await googleSync.syncPlans(userId);
    } catch (err) {
        console.error('Plan sync failed:', err.message);
    }

    const now = new Date();
    const until = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);
    const items = [];

    // 1. Events the user saved or is attending
    const entries = await PlannerEvent.find({
        user: userId,
        status: { $in: ['interested', 'attending'] }
    }).populate('event');

    for (const entry of entries) {
        if (!entry.event) continue;   // the event was deleted
        for (const s of entry.event.sessions) {
            if (s.endTime > now && s.startTime < until) {
                items.push({
                    kind: 'event',
                    id: String(entry.event._id),
                    title: entry.event.title,
                    status: entry.status,          // 'interested' or 'attending'
                    start: s.startTime,
                    end: s.endTime
                });
            }
        }
    }

    // 2. Plans they created or were invited to (all-day plans skipped)
    const plans = await Plan.find({
        $or: [{ creator: userId }, { invitees: userId }],
        allDay: false,
        endTime: { $gt: now },
        startTime: { $lt: until }
    });

    for (const p of plans) {
        items.push({
            kind: 'plan',
            id: String(p._id),
            title: p.title,
            status: String(p.creator) === String(userId) ? 'creator' : 'invited',
            start: p.startTime,
            end: p.endTime
        });
    }

    // 3. Sort by start time, then compare each item with the ones right after it
    items.sort((a, b) => a.start - b.start);

    // 3. Personal Google events (only if "Include personal commitments" is on)
    try {
        const personal = await googleSync.getPersonalEvents(userId, now, until);
        for (const g of personal) {
            // Skip Google copies of events already in the list (e.g. attending events synced to Google)
            const duplicate = items.some(it =>
                it.title === g.title && new Date(it.start).getTime() === g.start.getTime()
            );
            if (!duplicate) items.push(g);
        }
    } catch (err) {
        console.error('Could not load personal events:', err.message);
    }

    const alerts = [];
    const tightMs = TIGHT_GAP_MINUTES * 60 * 1000;

    for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
            const a = items[i];
            const b = items[j];

            // Sorted, so once one item is far enough away, all later ones are too
            if (b.start - a.end >= tightMs) break;

            // Two sessions of the same event aren't a clash
            if (a.kind === b.kind && a.id === b.id) continue;

            if (b.start < a.end) {
                alerts.push({
                    type: 'overlap',
                    items: [a, b],
                    overlapStart: b.start,
                    overlapEnd: new Date(Math.min(a.end, b.end))
                });
            } else {
                alerts.push({
                    type: 'tight',
                    items: [a, b],
                    gapMinutes: Math.round((b.start - a.end) / 60000)
                });
            }
        }
    }

    return alerts;
};