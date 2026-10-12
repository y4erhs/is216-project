const userService = require('../services/userService')

exports.getPreferences = async (req, res) => {
    try {
        const {userId} = req.query
        if (!userId) {
            return res.status(400).json({ message: 'userId is required' })
        }
        const preferences = await userService.getInterests(userId)
        res.json(preferences)
    } 
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}