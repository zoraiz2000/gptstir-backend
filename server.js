require("dotenv").config();
const cors = require("cors");
const express = require("express");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const authMiddleware = require("./middleware/auth");

const app = express();
const port = process.env.PORT || 5000;

// More explicit CORS configuration
app.use(cors({
  origin: true, // Reflect the request origin or use an array like ['http://localhost:5173', 'https://your-frontend.com']
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version', 'Authorization']
}));

// Handle OPTIONS preflight requests
app.options('*', cors());

app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/chat", authMiddleware, chatRoutes);

// Export for Vercel serverless deployment
module.exports = app;

// Only start the server if not in production (Vercel handles this in production)
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
