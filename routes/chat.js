const express = require("express");
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const { OpenAI } = require("openai");
const dbUtils = require('../db/utils');
const auth = require('../middleware/auth');

// Initialize API clients
const anthropic = new Anthropic({ 
  apiKey: process.env.CLAUDE_API_KEY 
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// For xAI/Grok models
const xai = new OpenAI({
  baseURL: 'https://api.x.ai/v1',
  apiKey: process.env.XAI_API_KEY,
});

// Apply auth middleware to all routes
router.use(auth);

// Create new conversation
router.post("/conversation", async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;
    const conversation = await dbUtils.createConversation(userId, title || "New Chat");
    res.json(conversation);
  } catch (err) {
    console.error('Error creating conversation:', err);
    res.status(500).json({ error: "Error creating conversation" });
  }
});

// Helper function to normalize model names for API calls
const normalizeModelName = (modelName, modelType) => {
  if (modelType === 'openai') {
    return modelName.toLowerCase().replace(/\s+/g, '-');
  }
  
  if (modelType === 'claude') {
    return modelName; // Claude models already have the correct format
  }
  
  if (modelType === 'deepseek') {
    if (modelName === 'deepseek-chat') return 'deepseek-chat';
    if (modelName === 'deepseek-reasoner') return 'deepseek-coder-instruct';
    return 'deepseek-chat';
  }
  
  if (modelType === 'grok') {
    return modelName; // Grok models already have the correct format
  }
  
  return modelName;
};

// Send message to selected model
router.post("/", async (req, res) => {
  const { prompt, modelType, modelName, conversationId } = req.body;
  const userId = req.user.id;

  if (!prompt || !modelType || !modelName) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    // Create new conversation if none exists
    let currentConversationId = conversationId;
    if (!currentConversationId) {
      const conversation = await dbUtils.createConversation(userId, "New Chat");
      currentConversationId = conversation.id;
    }

    // Verify conversation belongs to user
    const conversation = await dbUtils.getConversation(currentConversationId);
    if (conversation.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized access to conversation" });
    }

    // Store user message
    await dbUtils.storeMessage(
      currentConversationId,
      'user',
      prompt,
      modelType,
      modelName
    );

    let response;
    const normalizedModelName = normalizeModelName(modelName, modelType);
    
    console.log(`Processing request for model: ${modelType}/${normalizedModelName}`);
    
    // Route to appropriate AI model
    switch (modelType) {
      case 'openai':
        const openaiMsg = await openai.chat.completions.create({
          model: normalizedModelName,
          messages: [{ role: "user", content: prompt }],
        });
        response = openaiMsg.choices[0].message.content;
        break;

      case 'claude':
        const claudeMsg = await anthropic.messages.create({
          model: normalizedModelName,
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        });
        response = claudeMsg.content[0].text;
        break;

      case 'deepseek':
        const deepseekMsg = await deepseek.chat.completions.create({
          model: normalizedModelName,
          messages: [{ role: "user", content: prompt }],
        });
        response = deepseekMsg.choices[0].message.content;
        break;
        
      case 'grok':
        const grokMsg = await xai.chat.completions.create({
          model: normalizedModelName,
          messages: [{ role: "user", content: prompt }],
        });
        response = grokMsg.choices[0].message.content;
        break;

      default:
        throw new Error('Invalid model type');
    }

    // Store AI response
    await dbUtils.storeMessage(
      currentConversationId,
      'assistant',
      response,
      modelType,
      modelName
    );

    // Update conversation timestamp
    await dbUtils.updateConversationTimestamp(currentConversationId);

    res.json({ 
      response,
      conversationId: currentConversationId
    });
  } catch (err) {
    console.error('Error processing message:', err);
    res.status(500).json({ error: `${modelType} API error: ${err.message}` });
  }
});

// Get conversation history
router.get("/conversation/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify conversation belongs to user
    const conversation = await dbUtils.getConversation(conversationId);
    if (conversation.user_id !== userId) {
      return res.status(403).json({ error: "Unauthorized access to conversation" });
    }

    const messages = await dbUtils.getConversationMessages(conversationId);
    res.json(messages);
  } catch (err) {
    console.error('Error fetching conversation:', err);
    res.status(500).json({ error: "Error fetching conversation" });
  }
});

// Get user's conversations
router.get("/conversations", async (req, res) => {
  try {
    const userId = req.user.id;
    const conversations = await dbUtils.getUserConversations(userId);
    res.json(conversations);
  } catch (err) {
    console.error('Error fetching conversations:', err);
    res.status(500).json({ error: "Error fetching conversations" });
  }
});

// Rename conversation
router.put("/conversation/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const conversation = await dbUtils.renameConversation(conversationId, userId, title);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json(conversation);
  } catch (err) {
    console.error('Error renaming conversation:', err);
    res.status(500).json({ error: "Error renaming conversation" });
  }
});

// Delete conversation
router.delete("/conversation/:conversationId", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const deletedConversation = await dbUtils.deleteConversation(conversationId, userId);
    if (!deletedConversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    res.json({ message: "Conversation deleted successfully" });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ error: "Error deleting conversation" });
  }
});

module.exports = router; 