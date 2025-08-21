# Brew & Byte Café ☕

A modern AI-powered coffee ordering application featuring an intelligent barista agent with real-time voice capabilities and tool integration.

## 🎯 Live Demo & Presentation

![Brew & Byte Demo](public/demo-preview.gif)

<iframe src="https://wickdninja.github.io/agent-sdk/" width="100%" height="600" frameborder="0" allowfullscreen></iframe>

📊 **[View the Full Presentation](https://wickdninja.github.io/agent-sdk/)** - Learn about building real-time voice agents with OpenAI SDK

## Features

- **AI Barista Agent (Bella)** - Interactive chat-based ordering system with personality
- **Voice Integration** - Real-time voice interactions powered by OpenAI's SDK
- **Function Calling/Tools** - Agent can:
  - Fetch menu items
  - Create/find user accounts
  - Calculate order totals with tax
  - Submit and track orders
  - Provide personalized suggestions
- **Modern Architecture** - Clean vanilla JavaScript with Express backend
- **Beautiful UI** - Tailwind CSS with responsive design
- **Session Management** - Intelligent conversation tracking and context retention
- **Analytics Dashboard** - Real-time order tracking and business insights

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- OpenAI API Key
- npm or yarn

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

## 🏗️ Architecture Overview

The application uses a modern event-driven architecture with real-time communication between the frontend and backend:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Express API │────▶│  OpenAI API │
│  (Client)   │◀────│   (Server)   │◀────│  (GPT-4)    │
└─────────────┘     └──────────────┘     └─────────────┘
       │                    │                     │
       └────────────────────┴─────────────────────┘
              WebSocket/HTTP Communication
```

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

## 🛠️ Technologies Used

- **Frontend**: 
  - Pure Vanilla JavaScript (ES6+)
  - HTML5 with semantic markup
  - Tailwind CSS (via CDN) for styling
  - Real-time WebSocket connections
  
- **Backend**: 
  - Node.js & Express.js
  - SQLite for order persistence
  - Session management system
  - RESTful API design
  
- **AI Integration**: 
  - OpenAI GPT-4 with Function Calling
  - Custom tool implementations
  - Context-aware conversation handling
  - Voice SDK integration
  
- **Developer Tools**:
  - Nodemon for hot reloading
  - Environment variable management
  - Comprehensive logging system

## 📚 API Documentation

### Available Endpoints

- `POST /api/chat` - Send message to AI agent
- `GET /api/menu` - Fetch available menu items
- `POST /api/order` - Submit a new order
- `GET /api/orders` - Retrieve order history
- `GET /api/analytics` - Access business analytics
- `GET /api/session` - Get current session data

### Tool Functions

The AI agent has access to these tools:

1. **fetch_menu()** - Returns the complete menu with items and prices
2. **set_user(name, email)** - Creates or retrieves user account
3. **confirm_order(items)** - Calculates total with tax and fees
4. **submit_order(order_data)** - Finalizes and stores the order
5. **get_suggestions(preferences)** - Provides personalized recommendations

## 🎨 UI Components

- **Chat Interface** - Real-time messaging with the AI barista
- **Menu Display** - Interactive menu browser
- **Order Summary** - Live order tracking and pricing
- **Admin Dashboard** - Analytics and order management
- **Voice Control** - Hands-free ordering capability

## 🔒 Security & Best Practices

- Environment variables for sensitive data
- CORS configuration for API security
- Input validation and sanitization
- Error handling and logging
- Rate limiting considerations

## 📈 Future Enhancements

- [ ] User authentication system
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Loyalty program features
- [ ] Real-time order tracking
- [ ] Kitchen management system

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - feel free to use this project for learning and development.

## 🙏 Acknowledgments

- OpenAI for the powerful GPT-4 API
- The open-source community for invaluable tools and libraries
- Coffee lovers everywhere for the inspiration ☕

## 📞 Contact

For questions or feedback about this project, please open an issue or reach out through GitHub.

---

**Built with ❤️ and ☕ by developers, for developers**