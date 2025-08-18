# Brew & Byte Café ☕

A clean vanilla JavaScript fullstack application featuring an AI-powered barista agent for coffee ordering.

## Features

- **AI Barista Agent (Bella)** - Interactive chat-based ordering system
- **Function Calling/Tools** - Agent can:
  - Fetch menu items
  - Create/find user accounts
  - Calculate order totals
  - Submit orders
- **Simple Architecture** - No React, no TypeScript, just vanilla JS + Express
- **Tailwind CSS** - Beautiful styling via CDN

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file and add your OpenAI API key:
```bash
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY
```

3. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

4. Open your browser to `http://localhost:3001`

## How it Works

### Frontend (public/index.html & app.js)
- Pure vanilla JavaScript with no frameworks
- Manages chat interface and user interactions
- Sends messages to the backend agent API
- Handles tool execution results

### Backend (server.js)
- Express server with tool endpoints
- Proxies OpenAI API calls with function definitions
- Manages user sessions and orders in memory
- Provides REST endpoints for each tool

### Agent Tools

1. **fetch_menu** - Returns the full menu with prices
2. **set_user** - Creates or finds a user account
3. **confirm_order** - Calculates order total with tax
4. **submit_order** - Finalizes and saves the order

## Project Structure

```
.
├── server.js           # Express backend with OpenAI agent integration
├── public/
│   ├── index.html     # Main HTML with Tailwind CSS
│   └── app.js         # Vanilla JS frontend logic
├── package.json       # Dependencies (express, cors, dotenv, openai)
├── package-lock.json  # Lock file
├── node_modules/      # Dependencies
├── .env               # Environment variables (add your API key here)
├── .env.example       # Environment variables template
└── README.md          # This file
```

## Technologies Used

- **Frontend**: HTML, CSS (Tailwind via CDN), Vanilla JavaScript
- **Backend**: Node.js, Express
- **AI**: OpenAI GPT-4 with Function Calling
- **Styling**: Tailwind CSS (CDN)

## Notes

- This is a demonstration of agent + tools functionality
- Orders are stored in memory (not persistent)
- No authentication or security features for simplicity