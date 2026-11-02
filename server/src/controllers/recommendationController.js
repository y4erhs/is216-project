const Recommendations = require('../models/recommendation');
const recommendationService = require('../services/recommendationService');

const FEEDBACK_KEPT_MS = 180 * 24 * 60 * 60 * 1000;   // about a semester

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

// "Less like this": hide the event, and remember it so the AI can avoid similar ones
exports.lessLikeThis = async (req, res) => {
    try {
        const { userId } = req.body
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' })
        }

        const recommendation = await Recommendations.findOneAndUpdate(
            { _id: req.params.id, user: userId },
            {
                hidden: true,
                feedback: true,
                // recommendations auto-delete when expiresAt passes, so keep this one for the AI to learn from
                expiresAt: new Date(Date.now() + FEEDBACK_KEPT_MS)
            },
            { new: true }
        );
        if (!recommendation) {
            return res.status(404).json({ message: 'Recommendation not found' })
        }
        return res.status(200).json(recommendation)
    } catch (err) {
        return res.status(500).json({ message: err.message })
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