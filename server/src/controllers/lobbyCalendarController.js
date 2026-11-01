const { getLobbyCalendar } = require('../services/lobbyCalendarService');

exports.getCalendar = async (req, res) => {
    try {
        const { lobbyId } = req.params;
        const { userId, month } = req.query;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const data = await getLobbyCalendar(lobbyId, userId, month);
        res.json(data);
    } catch (err) {
        console.error(err);
        res.status(err.status || 500).json({ message: err.message || 'Server error' });
    }
};