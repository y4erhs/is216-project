const express = require('express');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });
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
const scheduleRoutes = require('./src/routes/scheduleRoutes');

const server = express();

server.use(express.urlencoded({ extended: true }));

const allowedLocalhost = /^http:\/\/localhost(:\d+)?$/;

const allowed127 = /^http:\/\/127\.0\.0\.1(:\d+)?$/;
server.use(cors({
  origin: (origin, callback) => {
    
    if (!origin) return callback(null, true);

    if (allowedLocalhost.test(origin) || allowed127.test(origin)) {
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
  const hostname = "localhost"; 
  const port = 8000;
 
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

connectDB().then(() => {
  startServer();
  bot.start();
  console.log("Telegram bot polling...");
});

process.once("SIGINT", () => bot.stop());
process.once("SIGTERM", () => bot.stop());