
const Event = require('../models/Event');

// CREATE an event
exports.createEvent = async (req, res) => {
    try {
        const event = await Event.create(req.body);
        return res.status(201).json(event);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

// READ all events
exports.getEvents = async (req, res) => {
    try {
        const events = await Event.find()
            .populate('organiser', 'username avatar')
            .sort({ createdAt: -1 });

        return res.status(200).json(events);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

// READ one event
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('organiser', 'username avatar');

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
