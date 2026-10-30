const OpenAI = require('openai');
const Event = require('../models/events');
const TelegramMessage = require('../models/telegramMessage');

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || undefined
});

// Replace with the same tag names as your interests dropdown,
// so recommendations can match them to users
const ALLOWED_TAGS = ['tech', 'sports', 'arts', 'music', 'career', 'volunteering', 'culture', 'wellness'];

exports.parseMessage = async (msgDoc) => {
    try {
        const prompt = `You extract campus event details from a Singapore university CCA's Telegram post.
Post sent at: ${msgDoc.sentAt.toISOString()} (use this to work out dates like "this Friday")
Posted in: ${msgDoc.chatTitle}
Post:
"""
${msgDoc.text}
"""

If the post is not announcing an event, reply with ONLY: {"isEvent": false}
Otherwise reply with ONLY a JSON object in this exact format:
{
  "isEvent": true,
  "title": "<short event name>",
  "description": "<2-3 sentence summary for students; include any sign-up link>",
  "organiser": "<organising CCA or club, or null>",
  "venue": "<venue, or null>",
  "sessions": [{"startTime": "<ISO 8601 with +08:00>", "endTime": "<ISO 8601 with +08:00, or null>"}],
  "tags": [<1 to 3 tags chosen only from: ${ALLOWED_TAGS.join(', ')}>]
}
All times are Singapore time. Never invent details; use null if something is not stated.`;

        const completion = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
        });

        const text = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
        const data = JSON.parse(text);

        // Not an event: mark done and stop
        if (!data.isEvent) {
            msgDoc.status = 'parsed';
            await msgDoc.save();
            return null;
        }

        // Keep only valid times; if there's no end time, assume 1 hour (reviewer can fix)
        const sessions = (data.sessions || [])
            .filter(s => s.startTime && !isNaN(new Date(s.startTime)))
            .map(s => {
                const start = new Date(s.startTime);
                const end = s.endTime && !isNaN(new Date(s.endTime))
                    ? new Date(s.endTime)
                    : new Date(start.getTime() + 60 * 60 * 1000);
                return { startTime: start, endTime: end };
            });

        if (sessions.length === 0) throw new Error('No usable date/time found');

        const chatIdStr = String(msgDoc.chatId);
        const eventData = {
            title: data.title || 'Untitled event',
            description: data.description || msgDoc.text,
            organiser: data.organiser || msgDoc.chatTitle,
            venue: data.venue || 'TBC',
            sessions,
            tags: (data.tags || []).filter(t => ALLOWED_TAGS.includes(t)),
            source: 'telegram',
            sourceLink: chatIdStr.startsWith('-100')
                ? `https://t.me/c/${chatIdStr.slice(4)}/${msgDoc.messageId}`
                : '',
            status: 'pending',
            image: msgDoc.image || ''
        };

        // Edited post: update its existing event. New post: create one.
        let event = null;
        if (msgDoc.event) {
            event = await Event.findByIdAndUpdate(msgDoc.event, eventData, { new: true, runValidators: true });
        }
        if (!event) {
            // Is this a reminder for an event this chat already posted?
            const chatEventIds = await TelegramMessage.distinct('event', {
                chatId: msgDoc.chatId,
                event: { $ne: null }
            });

            const start = sessions[0].startTime.getTime();
            const window = 30 * 60 * 1000;   // within 30 minutes counts as the same event

            const existing = await Event.findOne({
                _id: { $in: chatEventIds },
                sessions: { $elemMatch: { startTime: {
                    $gte: new Date(start - window),
                    $lte: new Date(start + window)
                } } }
            });

            if (existing) {
                msgDoc.duplicateOf = existing._id;
                msgDoc.status = 'parsed';
                msgDoc.error = undefined;
                await msgDoc.save();
                console.log('Reminder detected for:', existing.title);
                return existing;
            }

            event = await Event.create(eventData);
        }

        msgDoc.event = event._id;
        msgDoc.status = 'parsed';
        msgDoc.error = undefined;
        await msgDoc.save();
        return event;

    } catch (err) {
        msgDoc.status = 'failed';
        msgDoc.error = err.message;
        await msgDoc.save();
        console.error('Parse failed:', err.message);
        return null;
    }
};