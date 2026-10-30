const planService = require('../services/planService');

exports.createPlan = async (req, res) => {
    try {
        const { plan, warning } = await planService.createPlan(req.body);
        return res.status(201).json({ plan, warning });
    } catch (err) {
        return res.status(err.status || 500).json({ message: err.message });
    }
};