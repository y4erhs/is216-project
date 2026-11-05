const express = require('express');
const dotenv = require('dotenv');
const cron = require('node-cron');
const notificationController = require('./src/controllers/notificationController');

dotenv.config({ path: './config.env' });
if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Add it to config.env (see the README), then start the server again.');
  process.exit(1);
}
const bot = process.env.TELEGRAM_BOT_TOKEN ? require('./telegramBot') : null;

const mongoose = require('mongoose');
const fs = require('fs');
const cors = require("cors");
const path = require('path')


// Import routes
const recommendationRoutes = require('./src/routes/recommendationRoutes');
const eventRoutes = require('./src/routes/eventRoutes');
const userRoutes = require('./src/routes/userRoutes');
const friendsRoutes = require('./src/routes/friendsRoutes');
const lobbyRoutes = require('./src/routes/lobbyRoutes');
const activityRoutes = require('./src/routes/activityRoutes');
const googleRoutes = require('./src/routes/googleRoutes')
const notificationRoutes = require('./src/routes/notificationRoutes');
const planRoutes = require('./src/routes/planRoutes');
const imageRoutes = require('./src/routes/imageRoutes');
const scheduleRoutes = require('./src/routes/scheduleRoutes');




const server = express();

server.use(express.urlencoded({ extended: true }));

const allowedLocalhost = /^http:\/\/localhost(:\d+)?$/;

const allowed127 = /^http:\/\/127\.0\.0\.1(:\d+)?$/;
server.use(cors({
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);

    // the live site's address comes from CLIENT_URL
    const liveSite = (process.env.CLIENT_URL || '').replace(/\/$/, '');
    if (allowedLocalhost.test(origin) || allowed127.test(origin) || origin === liveSite) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: false 
}));


server.use(express.json());

server.set("view engine", "ejs"); 

//use routes
server.use('/api/recommendations', recommendationRoutes);
server.use('/api/users', userRoutes);
server.use('/api/events', eventRoutes);
server.use('/api/friends', friendsRoutes);
server.use('/api/lobbies', lobbyRoutes);
server.use('/api/activities', activityRoutes);
server.use("/api/notifications", notificationRoutes);
server.use('/auth/google', googleRoutes);
server.use('/uploads', express.static(path.join(__dirname, 'uploads')));
server.use('/api/images', imageRoutes);
server.use('/api/plans', planRoutes);
server.use('/api/schedule', scheduleRoutes);



async function connectDB() {
  try {
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

function startServer() {
  // Hosts like Render set PORT and need the server reachable from outside
  const hostname = process.env.PORT ? "0.0.0.0" : "localhost";
  const port = process.env.PORT || 8000;
 
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

connectDB().then(() => {
  startServer();
  cron.schedule('*/10 * * * *', async () => {
    try {
      await notificationController.dispatchUpcomingEvents();
    } catch (err) {
      console.error('dispatchUpcomingEvents failed', err);
    }
  });
  // Every minute, so reminders go off on time
  cron.schedule('* * * * *', async () => {
    try {
      await notificationController.dispatchDueReminders();
    } catch (err) {
      console.error('dispatchDueReminders failed', err);
    }
  });
  // No TELEGRAM_BOT_TOKEN in config.env means no bot, but the rest of the server still runs
  if (bot) {
    bot.start();
    console.log("Telegram bot polling...");
  } else {
    console.log("No TELEGRAM_BOT_TOKEN, so the Telegram bot is off");
  }
});

process.once("SIGINT", () => bot?.stop());
process.once("SIGTERM", () => bot?.stop());

