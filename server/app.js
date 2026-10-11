const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const fs = require('fs');
const cors = require("cors");

// Import routes
const eventRoutes = require('./routes/eventRoutes');
const userRoutes = require('./routes/userRoutes');


// const blogsRoutes = require('./routes/blogs-routes');

const server = express();

server.use(express.urlencoded({ extended: true }));
server.use('/events', eventRoutes);
server.use('/users', userRoutes);

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

// server.use('/posts', blogsRoutes);

dotenv.config({ path: './config.env' });

async function connectDB() {
  try {
    await mongoose.connect(process.env.DB);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

function startServer() {
  const hostname = "localhost"; 
  const port = 8000;
 
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

connectDB().then(startServer);