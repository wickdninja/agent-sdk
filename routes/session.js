const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();
const sessionManager = require('../services/session-manager');

// Ephemeral token endpoint for WebRTC
router.get('/', async (req, res) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  try {
    const response = await fetch(
      'https://api.openai.com/v1/realtime/sessions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-realtime-preview-2024-12-17',
          voice: 'alloy',
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return res
        .status(response.status)
        .json({ error: 'Failed to create session' });
    }

    const data = await response.json();
    
    // Create a new session for this WebRTC connection
    const sessionId = sessionManager.generateSessionId();
    await sessionManager.getOrCreateSession(sessionId);
    
    // Include session ID in response
    res.json({
      ...data,
      sessionId
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;