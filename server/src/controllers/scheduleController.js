const scheduleService = require('../services/scheduleService');

exports.getConflicts = async (req, res) => {
    try {
        const alerts = await scheduleService.getConflicts(req.query.userId);
        return res.status(200).json({ alerts });
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
};