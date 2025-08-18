const express = require('express');
const cors = require('cors');
const winston = require('winston');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY is required but missing');
}

app.use(cors());
app.use(express.json());

async function createEphemeralToken(options = {}) {
  const { model, voice } = options;

  try {
    logger.info('Creating ephemeral token for Realtime API');

    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'gpt-4o-realtime-preview-2025-06-03',
        voice,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to create ephemeral token', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Failed to create ephemeral token: ${response.statusText}`);
    }

    const data = await response.json();

    logger.info('Ephemeral token created successfully', {
      expiresAt: data.client_secret.expires_at,
    });

    return data;
  } catch (error) {
    logger.error('Error creating ephemeral token', { error: error.message });
    throw error;
  }
}

app.post('/api/realtime/token', async (req, res) => {
  try {
    const { model, voice } = req.body;
    const tokenResponse = await createEphemeralToken({ model, voice });
    res.json(tokenResponse);
  } catch (error) {
    logger.error('Error handling token request', { error: error.message });
    res.status(500).json({ 
      error: 'Failed to create ephemeral token',
      message: error.message 
    });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Endpoint: POST http://localhost:${PORT}/api/realtime/token`);
});