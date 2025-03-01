require("dotenv").config();
const cors = require("cors");
const express = require("express");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const authMiddleware = require("./middleware/auth");

const app = express();
const port = process.env.PORT || 5000;

// More permissive CORS configuration that specifically allows localhost
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://gptstir.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version', 'Authorization']
}));

// Handle OPTIONS preflight requests
app.options('*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://gptstir.vercel.app'],
  credentials: true
}));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - Origin: ${req.headers.origin || 'N/A'}`);
  next();
});

app.use(express.json({ limit: '1mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Public routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use("/api/chat", authMiddleware, chatRoutes);

// If running in Vercel
if (process.env.VERCEL) {
  // Export for Vercel serverless deployment
  module.exports = app;
} else {
  // Start the server if running locally
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}
