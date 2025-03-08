require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { OpenAI } = require('openai');

// Initialize Express app
const app = express();
app.use(express.json()); // Parse incoming JSON requests

// MongoDB Connection (You should replace with your DB URI)
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error(err));

// User Schema to store credentials securely
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  wordpress: {
    siteUrl: String,
    username: String,
    appPassword: String, // Store securely (e.g., encrypted)
  },
});

const User = mongoose.model('User', userSchema);

// Initialize OpenAI client (ensure you have your OpenAI API key)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Connect to WordPress API (helper function)
const connectToWordPress = async (user, credentials) => {
  const { siteUrl, username, appPassword } = credentials;
  const postUrl = `${siteUrl}/wp-json/wp/v2/posts`;

  try {
    // Try a simple API request to check if the credentials are valid
    const response = await axios.get(postUrl, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      },
    });

    // If successful, save WordPress credentials in the user's record (or update)
    user.wordpress = { siteUrl, username, appPassword };
    await user.save();

    return { success: true, message: 'Connected to WordPress successfully!' };
  } catch (error) {
    return { success: false, message: 'Failed to connect to WordPress. Check credentials.' };
  }
};

// Middleware to authenticate users using JWT
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// API 1: /connectToWordpress (Connect user's WordPress site)
app.post('/connectToWordpress', authenticate, async (req, res) => {
  const { siteUrl, username, appPassword } = req.body;

  // Find user in the database
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Try connecting to WordPress using the provided credentials
  const result = await connectToWordPress(user, { siteUrl, username, appPassword });
  if (result.success) {
    return res.status(200).json(result);
  } else {
    return res.status(400).json(result);
  }
});

// API 2: /postBlogImmediate (Publish AI-generated content immediately)
app.post('/postBlogImmediate', authenticate, async (req, res) => {
  const { title, content } = req.body;

  // Find user in the database
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Check if the user has connected their WordPress
  const { siteUrl, username, appPassword } = user.wordpress;
  if (!siteUrl || !username || !appPassword) {
    return res.status(400).json({ message: 'User has not connected their WordPress site.' });
  }

  // Generate AI content (using OpenAI)
  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4', // or your desired model
      messages: [{ role: 'system', content: 'Generate a blog post' }, { role: 'user', content: content }],
    });

    const generatedContent = aiResponse.choices[0].message.content;

    // Create a new post on WordPress
    const postUrl = `${siteUrl}/wp-json/wp/v2/posts`;
    const response = await axios.post(postUrl, {
      title: title,
      content: generatedContent,
      status: 'publish', // Publish immediately
    }, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      },
    });

    return res.status(200).json({ message: 'Blog post published successfully', data: response.data });
  } catch (error) {
    return res.status(500).json({ message: 'Error publishing blog post', error: error.message });
  }
});

// API 3: /postBlogSchedule (Schedule AI-generated content for later)
app.post('/postBlogSchedule', authenticate, async (req, res) => {
  const { title, content, scheduledTime } = req.body;

  // Find user in the database
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Check if the user has connected their WordPress
  const { siteUrl, username, appPassword } = user.wordpress;
  if (!siteUrl || !username || !appPassword) {
    return res.status(400).json({ message: 'User has not connected their WordPress site.' });
  }

  // Generate AI content
  try {
    const aiResponse = await openai.chat.completions.create({
      model: 'gpt-4', // or your desired model
      messages: [{ role: 'system', content: 'Generate a blog post' }, { role: 'user', content: content }],
    });

    const generatedContent = aiResponse.choices[0].message.content;

    // Create a new post on WordPress
    const postUrl = `${siteUrl}/wp-json/wp/v2/posts`;
    const response = await axios.post(postUrl, {
      title: title,
      content: generatedContent,
      status: 'future', // Schedule for later
      date: scheduledTime, // Schedule time in 'YYYY-MM-DDTHH:MM:SS'
    }, {
      headers: {
        Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      },
    });

    return res.status(200).json({ message: 'Blog post scheduled successfully', data: response.data });
  } catch (error) {
    return res.status(500).json({ message: 'Error scheduling blog post', error: error.message });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
