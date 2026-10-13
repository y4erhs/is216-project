const Recommendations = require('../models/recommendation');
const recommendationService = require('../services/recommendationService');

//get all recommendations for that user
exports.getRecommendationsByUser = async (req, res) => {
    try {
        const recommendations = await Recommendations.find({
            user: req.params.id,
            hidden: false,
            expiresAt: { $gt: new Date() }
        }).populate('event').sort({ score: -1 });

        const available = recommendations.filter(r =>
            r.event && (r.event.slots == null || r.event.signUpCount < r.event.slots)
        );

        return res.status(200).json(available);
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

//generate recommendation (calling on service)
exports.generateRecommendations = async (req, res) => {
    try {
        const { userId, feedType = 'weekly' } = req.body
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' })
        }
        if (!['daily', 'weekly'].includes(feedType)) {
            return res.status(400).json({ message: 'feedType must be daily or weekly' })
        }

        const saved = await recommendationService.generateForUser(userId, feedType);
        if (!saved) {
            return res.status(404).json({ message: 'User not found' })
        }
        return res.status(201).json(saved)
    } catch (err) {
        return res.status(500).json({ message: err.message })
    }
};