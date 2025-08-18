const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Check for API key
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error('OPENAI_API_KEY is required but missing');
  process.exit(1);
}

// Ephemeral token endpoint
app.post('/api/session', async (req, res) => {
  try {
    const { model, voice } = req.body;
    
    console.log('Creating ephemeral token for Realtime API');
    
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-realtime-preview-2024-12-17',
        voice: voice || 'alloy',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create ephemeral token', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return res.status(response.status).json({ 
        error: `Failed to create ephemeral token: ${response.statusText}` 
      });
    }

    const data = await response.json();
    
    console.log('Ephemeral token created successfully', {
      expiresAt: data.client_secret?.expires_at,
    });

    res.json(data);
  } catch (error) {
    console.error('Error creating ephemeral token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Ephemeral token endpoint: POST http://localhost:${PORT}/api/session`);
});