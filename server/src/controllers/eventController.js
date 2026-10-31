const Event = require('../models/events');
const notificationController = require('./notificationController');

// CREATE an event
exports.createEvent = async (req, res) => {
    try {
        const event = await Event.createEvent(req.body);
        return res.status(201).json(event);
    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};


// READ all events, with optional search:
exports.getEvents = async (req, res) => {
    try {
        const { q, tags, from, to } = req.query;
        const filter = {};

        //For search in smart recommendations feature
        // Keyword: match title, description, organiser or venue
        if (q) {
            const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(safe, 'i');
            filter.$or = [
                { title: regex },
                { description: regex },
                { organiser: regex },
                { venue: regex }
            ];
        }
        // Category: event has at least one of these tags (ignoring upper/lower case)
        if (tags) {
            const tagRegexes = tags.split(',').map(t => t.trim()).filter(Boolean).map(t =>
                new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i')
            );
            filter.tags = { $in: tagRegexes };
        }
        // Date: at least one session starts within the range (Singapore time)
        if (from || to) {
            const startTime = {};
            if (from) startTime.$gte = new Date(from + 'T00:00:00+08:00');
            if (to) startTime.$lte = new Date(to + 'T23:59:59+08:00');
            filter.sessions = { $elemMatch: { startTime } };
        }

        const events = await Event.getEvents(filter);

        return res.status(200).json(events);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// READ one event
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.getEventById(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        return res.status(200).json(event);
    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

// UPDATE an event
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.updateEvent(
            req.params.id,
            req.body
        );

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        return res.status(200).json(event);

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};
// DELETE an event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.deleteEvent(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        return res.status(200).json({
            message: 'Event deleted successfully'
        });

    } catch (err) {
        return res.status(400).json({
            message: err.message
        });
    }
};

exports.signUpUser = async (req, res) => {
    try {
        const { eventId, userId } = req.body;

        const updatedEvent = await Event.signUpUser(
            eventId,
            userId
        );

        if (!updatedEvent) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        await notificationController.notifyRsvpUpdate(
            userId,
            updatedEvent,
            'Registered'
        );

        return res.status(200).json(updatedEvent);

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};