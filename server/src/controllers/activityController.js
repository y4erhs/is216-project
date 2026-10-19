const mongoose = require('mongoose')
const Activity = require('../models/activity')
const Event = require('../models/events')

const validIds = (...ids) => ids.every(id => mongoose.isValidObjectId(id))

// GET all tracked events for a user (with event details)
exports.getActivities = async (req, res) => {
    try {
        if (!validIds(req.params.id)) {
            return res.status(400).json({ message: 'Invalid user id' })
        }
        const list = await Activity.find({ user: req.params.id })
            .populate('event')
            .sort({ updatedAt: -1 })

        // skip records whose event has since been deleted
        return res.status(200).json(list.filter(a => a.event))
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}

// PUT: set interested / going (per session) / note for one event
exports.upsertActivity = async (req, res) => {
    try {
        const { id, eventId } = req.params
        if (!validIds(id, eventId)) {
            return res.status(400).json({ message: 'Invalid id' })
        }

        const { interested, going, sessionStart, note } = req.body
        const updates = {}
        if (interested !== undefined) updates.interested = !!interested
        if (note !== undefined) updates.note = note

        let startMs
        if (going !== undefined) {
            if (!['none', 'attending', 'attended'].includes(going)) {
                return res.status(400).json({ message: 'Invalid going value' })
            }
            startMs = new Date(sessionStart).getTime()
            if (Number.isNaN(startMs)) {
                return res.status(400).json({ message: 'sessionStart is required with going' })
            }
        }

        if (Object.keys(updates).length === 0 && going === undefined) {
            return res.status(400).json({ message: 'Nothing to update' })
        }

        const filter = { user: id, event: eventId }
        const opts = { upsert: true, runValidators: true, setDefaultsOnInsert: true }

        if (Object.keys(updates).length > 0) {
            await Activity.updateOne(filter, { $set: updates }, opts)
        }

        if (going !== undefined) {
            if (going !== 'none') {
                const event = await Event.findById(eventId)
                const session = event?.sessions.find(s => new Date(s.startTime).getTime() === startMs)
                if (!session) return res.status(404).json({ message: 'Session not found' })

                const now = new Date()
                if (going === 'attending' && new Date(session.endTime) < now) {
                    return res.status(400).json({ message: 'This session has already ended' })
                }
                if (going === 'attended' && new Date(session.startTime) > now) {
                    return res.status(400).json({ message: 'This session has not started yet' })
                }
            }

            const start = new Date(startMs)
            // clear this session's entry, then add the new one (can't $pull and $push the same field in one update)
            await Activity.updateOne(filter, { $pull: { sessions: { startTime: start } } }, opts)
            if (going !== 'none') {
                await Activity.updateOne(filter, { $push: { sessions: { startTime: start, going } } })
            }
        }

        const doc = await Activity.findOne(filter).populate('event')

        // nothing left to track, so remove the record
        if (!doc.interested && doc.sessions.length === 0 && !doc.note) {
            await Activity.deleteOne({ _id: doc._id })
            return res.status(200).json({ removed: true, eventId })
        }

        return res.status(200).json(doc)
    } catch (err) {
        return res.status(400).json({ message: err.message })
    }
}

// DELETE: stop tracking an event
exports.deleteActivity = async (req, res) => {
    try {
        const { id, eventId } = req.params
        if (!validIds(id, eventId)) {
            return res.status(400).json({ message: 'Invalid id' })
        }
        await Activity.findOneAndDelete({ user: id, event: eventId })
        return res.status(200).json({ message: 'Removed from your activity' })
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
}