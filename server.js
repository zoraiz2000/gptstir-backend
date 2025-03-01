require("dotenv").config();
const cors = require("cors");
const express = require("express");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const authMiddleware = require("./middleware/auth");

const app = express();
const port = process.env.PORT || 3000; // Changed from 5000 to 3000


const allowedOrigins = [
  "http://localhost:5173", // Local development
];

app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, // Allows cookies and headers like Authorization
}));

app.use(express.json());

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/chat", authMiddleware, chatRoutes);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
