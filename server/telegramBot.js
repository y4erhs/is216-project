const { Bot } = require("grammy");
const TelegramMessage = require('./src/models/telegramMessage');
const { parseMessage } = require('./src/services/telegramParserService');
const fs = require('fs');
const path = require('path');

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

// Telegram stores hidden links (like "REGISTER HERE") separately from the text.
// This puts each URL back in, right after its words.
function addHiddenLinks(text, entities = []) {
  const links = entities
    .filter(e => e.type === 'text_link')
    .sort((a, b) => b.offset - a.offset);   // start from the end so positions don't shift

  let result = text;
  for (const e of links) {
    const end = e.offset + e.length;
    result = result.slice(0, end) + ` (${e.url})` + result.slice(end);
  }
  return result;
}

// Downloads the largest version of a photo and saves it in uploads/telegram
async function downloadPhoto(ctx, msg) {
  if (!msg.photo) return '';

  const largest = msg.photo[msg.photo.length - 1];        // last one = highest quality
  const file = await ctx.api.getFile(largest.file_id);
  const url = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Image download failed: ${res.status}`);

  const fileName = `${ctx.chat.id}_${msg.message_id}.jpg`;
  const folder = path.join(__dirname, 'uploads', 'telegram');
  fs.mkdirSync(folder, { recursive: true });              // create folder if missing
  fs.writeFileSync(path.join(folder, fileName), Buffer.from(await res.arrayBuffer()));

  return `/uploads/telegram/${fileName}`;
}

bot.on(["message", "channel_post", "edited_message", "edited_channel_post"], async (ctx) => {
  const msg = ctx.msg;
  const rawText = msg.text || msg.caption;
  if (!rawText) return;
  const text = addHiddenLinks(rawText, msg.entities || msg.caption_entities);

  const image = await downloadPhoto(ctx, msg).catch(err => {
    console.error('Image error:', err.message);
    return '';                                              // still save the text if the image fails
  });

  const saved = await TelegramMessage.findOneAndUpdate(       // 1. store the result
    { chatId: ctx.chat.id, messageId: msg.message_id },
    {
      chatTitle: ctx.chat.title || ctx.chat.first_name,
      text,
      sentAt: new Date(msg.date * 1000),
      edited: Boolean(ctx.editedMessage || ctx.editedChannelPost),
      status: 'new',
      ...(image && { image })                                  // keep the old image if this one is missing
    },
    { upsert: true, new: true }                                // 2. add new: true
  );

  console.log("Saved message from", ctx.chat.title || ctx.chat.first_name);

  await parseMessage(saved);                                   // 3. send it to the AI
});

// Stops one bad message from crashing your server
bot.catch((err) => console.error("Bot error:", err.message));

module.exports = bot;