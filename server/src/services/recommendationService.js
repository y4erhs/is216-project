const OpenAI = require('openai');

const Recommendation = require('../models/recommendation');
const Event = require('../models/events');
const PlannerEvent = require('../models/plannerEvent');
const User = require('../models/user');

exports.generateForUser = async (userId, feedType = 'weekly') => {
    const user = await User.findById(userId)
    if (!user) {
        return null
    }

    const now = new Date()
    const daysAhead = feedType === 'daily' ? 2 : 7
    const until = new Date(now.getTime() + daysAhead*24*60*60*1000)

    const plannerEntries = await PlannerEvent.find({user: userId}).populate('event')
    const plannerEventIds = plannerEntries.filter(p => p.event).map(p => String(p.event._id))

    const attendedTags = plannerEntries.filter(p => p.status == 'attended' && p.event).flatMap(p => p.event.tags)

    const hiddenRecs = await Recommendation.find({user: userId, hidden: true})
    const hiddenEventIds = hiddenRecs.map(r => String(r.event))

    const events = await Event.find({
        sessions: { $elemMatch: { startTime: { $gte: now, $lte: until } } }
    });

    const candidates = events.filter(e => {
        const id = String(e._id);
        if (plannerEventIds.includes(id)) return false;
        if (hiddenEventIds.includes(id)) return false;
        if (e.slots != null && e.signUpCount >= e.slots) return false;
        return true;
    }).slice(0, 50); // keep the prompt small

    await Recommendation.deleteMany({ user: userId, feedType, hidden: false });
    if (candidates.length === 0) return [];

    const student = {
        interests: user.preferences,
        ccas: user.ccas,
        notInterestedIn: user.mutedTags || [],
        tagsFromEventsAttended: [...new Set(attendedTags)]
    };
    const eventList = candidates.map(e => ({
        id: String(e._id),
        title: e.title,
        description: e.description,
        organiser: e.organiser,
        tags: e.tags
    }));

    const prompt = `You are ranking campus events for a university student.
        Student: ${JSON.stringify(student, null, 2)}
        Events: ${JSON.stringify(eventList, null, 2)}

        Pick up to 10 events this student would most likely enjoy, best first.
        Strongly prefer events matching their interests or CCAs, and events similar to ones they attended.
        Avoid events about topics in "notInterestedIn".
        Leave out events that are a poor match, even if that means returning fewer than 10.

        Reply with ONLY a JSON object, no other text, in this exact format:
        {"recommendations": [{"id": "<event id>", "match": <number 0-100>, "reason": "<one short sentence shown to the student>"}]}`;

    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || undefined
    });
    const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
    });

    const text = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    const ranked = JSON.parse(text).recommendations || [];

    const candidateMap = new Map(candidates.map(e => [String(e._id), e]))
    const picks = ranked.filter(r => candidateMap.has(r.id)).slice(0, 10)
        .map(r => {
            const event = candidateMap.get(r.id);
            return {
                user: userId,
                event: event._id,
                score: Math.max(0, Math.min(100, Math.round(r.match))),
                reasons: [r.reason],
                feedType,
                expiresAt: new Date(Math.max(...event.sessions.map(s => new Date(s.startTime))))
            };
        });
    
    return await Recommendation.insertMany(picks);
}