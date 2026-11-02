const planService = require('../services/planService');
const mongoose = require('mongoose');
const googleSync = require('../services/googleSyncService');

exports.createPlan = async (req, res) => {
    try {
        const { plan, warning } = await planService.createPlan(req.body);
        return res.status(201).json({ plan, warning });
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
};

exports.syncPlans = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({ message: 'Invalid user id' });
        }
        // plans: copy changes from Google. Attending sessions: make sure they're all in Google.
        const result = await googleSync.syncPlans(userId);
        const { added } = await googleSync.syncAttending(userId);
        return res.status(200).json({ ...result, added });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};