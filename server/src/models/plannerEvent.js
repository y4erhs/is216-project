// for like one event in one persons planner
const mongoose = require('mongoose')

const plannerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    status: {
        type: String,
        enum: ['interested', 'attending', 'attended'],
        default: 'interested',
    },
    notes: {
        type: String,
        default: ''
    }
},
{timestamps: true})

const PlannerEvent = mongoose.model('PlannerEvent', plannerSchema, 'plannerEvents')

module.exports = PlannerEvent