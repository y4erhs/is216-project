const mongoose = require('mongoose');

const telegramMessageSchema = new mongoose.Schema({
  chatId:    { type: Number, required: true },
  chatTitle: String,
  messageId: { type: Number, required: true },
  text:      { type: String, required: true },
  sentAt:    Date,
  edited:    { type: Boolean, default: false },
  status:    { type: String, enum: ['new', 'parsed', 'failed'], default: 'new' }, //new means waiting for AI to parse, parsed means AI has parsed
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  error: String,
  duplicateOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  image: { type: String, default: '' }
}, { timestamps: true });

// The same message can't be saved twice
telegramMessageSchema.index({ chatId: 1, messageId: 1 }, { unique: true });

module.exports = mongoose.model('telegramMessage', telegramMessageSchema);