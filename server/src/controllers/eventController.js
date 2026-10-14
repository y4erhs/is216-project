
const Event = require('../models/events');

// CREATE an event
exports.createEvent = async (req, res) => {
    try {
        const event = await Event.create(req.body);
        return res.status(201).json(event);
    } catch (err) {
        return res.status(400).json({ message: err.message });
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
        // Category: event has at least one of these tags
        if (tags) {
            filter.tags = { $in: tags.split(',') };
        }
        // Date: at least one session starts within the range (Singapore time)
        if (from || to) {
            const startTime = {};
            if (from) startTime.$gte = new Date(from + 'T00:00:00+08:00');
            if (to) startTime.$lte = new Date(to + 'T23:59:59+08:00');
            filter.sessions = { $elemMatch: { startTime } };
        }

        const events = await Event.find(filter).sort({ 'sessions.startTime': 1 });

        return res.status(200).json(events);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// READ one event
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        return res.status(200).json(event);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

// UPDATE an event
exports.updateEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        return res.status(200).json(event);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

// DELETE an event
exports.deleteEvent = async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);

        if (!event) {
            return res.status(404).json({
                message: 'Event not found'
            });
        }

        return res.status(200).json({
            message: 'Event deleted successfully'
        });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};
