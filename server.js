require("dotenv").config();
const cors = require("cors");
const express = require("express");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const authMiddleware = require("./middleware/auth");

const app = express();
const port = process.env.PORT || 5000; // Changed from 5000 to 3000

// Configure CORS
const corsOptions = {
  origin: [
    'http://localhost:5173',  // Your local frontend
    'http://localhost:3000',  // Common alternative port
    // process.env.FRONTEND_URL  // Your production frontend URL (if different)
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/chat", authMiddleware, chatRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
