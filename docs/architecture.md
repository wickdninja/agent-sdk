# Brew & Byte Café - System Architecture

## Overview
The Brew & Byte Café is an AI-powered coffee ordering system that uses OpenAI's Realtime API with WebRTC for voice interactions. The system provides a conversational interface for customers to place coffee orders through natural speech.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        UI[Web UI<br/>HTML/CSS/JS]
        Agent[Voice Agent<br/>agent.js]
        Admin[Admin Dashboard]
        Deck[Deck View]
    end
    
    subgraph "WebRTC Layer"
        WR[WebRTC Connection]
        DC[Data Channel]
        AC[Audio Channel]
    end
    
    subgraph "Server Layer"
        Express[Express Server<br/>server.js]
        Routes[API Routes]
        Session[Session Manager]
        Tools[Tool Services]
    end
    
    subgraph "External Services"
        OpenAI[OpenAI Realtime API]
    end
    
    subgraph "Data Layer"
        SQLite[(SQLite Database<br/>cafe.db)]
    end
    
    UI --> Agent
    Agent --> WR
    WR --> DC
    WR --> AC
    DC --> OpenAI
    AC --> OpenAI
    
    Agent --> Express
    Admin --> Express
    Deck --> Express
    
    Express --> Routes
    Routes --> Session
    Routes --> Tools
    Session --> OpenAI
    
    Tools --> SQLite
    Routes --> SQLite
```

## Component Architecture

```mermaid
graph LR
    subgraph "Frontend Components"
        direction TB
        App[app.js<br/>Menu Display]
        AgentJS[agent.js<br/>Voice Agent]
        AdminJS[Admin Dashboard]
        DeckJS[Deck Analytics]
    end
    
    subgraph "Backend Components"
        direction TB
        Server[server.js<br/>Main Server]
        DB[database.js<br/>DB Layer]
        Menu[menu.js<br/>Menu Data]
        
        subgraph "Routes"
            SessionR[session.js]
            ToolsR[tools.js]
            OrdersR[orders.js]
            AnalyticsR[analytics.js]
        end
        
        subgraph "Services"
            SessionMgr[session-manager.js]
            Suggestions[suggestions.js]
        end
    end
    
    AgentJS --> SessionR
    AgentJS --> ToolsR
    App --> ToolsR
    AdminJS --> OrdersR
    AdminJS --> AnalyticsR
    DeckJS --> AnalyticsR
    
    SessionR --> SessionMgr
    ToolsR --> DB
    ToolsR --> Menu
    ToolsR --> Suggestions
    OrdersR --> DB
    AnalyticsR --> DB
```

## WebRTC Communication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Agent
    participant Server
    participant OpenAI
    
    User->>Browser: Click "Start Order"
    Browser->>Agent: Initialize connection
    Agent->>Server: GET /api/session
    Server->>OpenAI: Request ephemeral token
    OpenAI-->>Server: Return token
    Server-->>Agent: Return token + session ID
    
    Agent->>Agent: Create RTCPeerConnection
    Agent->>Agent: Get user media (microphone)
    Agent->>Agent: Create data channel
    Agent->>OpenAI: Send SDP offer
    OpenAI-->>Agent: Return SDP answer
    
    Note over Agent,OpenAI: WebRTC connection established
    
    Agent->>OpenAI: Send session config via data channel
    OpenAI-->>Agent: Session created event
    
    loop Voice Conversation
        User->>Agent: Speak into microphone
        Agent->>OpenAI: Stream audio via WebRTC
        OpenAI->>OpenAI: Process speech-to-text
        OpenAI->>OpenAI: Generate AI response
        OpenAI-->>Agent: Stream audio response
        Agent-->>User: Play audio response
        
        alt Function Call Required
            OpenAI-->>Agent: Function call event
            Agent->>Server: Execute tool function
            Server->>Server: Process request
            Server-->>Agent: Return result
            Agent-->>OpenAI: Send function result
        end
    end
```

## Service Layer Architecture

```mermaid
graph TB
    subgraph "API Gateway"
        Express[Express Server<br/>Port 3001]
    end
    
    subgraph "Route Handlers"
        SessionRoute["/api/session<br/>WebRTC session management"]
        ToolsRoute["/api/tools/*<br/>Business logic tools"]
        OrdersRoute["/api/orders<br/>Order management"]
        AnalyticsRoute["/api/analytics<br/>Business analytics"]
    end
    
    subgraph "Business Services"
        SessionService[Session Manager<br/>- Token management<br/>- Session tracking]
        MenuService[Menu Service<br/>- Menu data<br/>- Pricing logic]
        UserService[User Service<br/>- User management<br/>- Preferences]
        OrderService[Order Service<br/>- Order processing<br/>- Status tracking]
        SuggestionService[Suggestion Engine<br/>- Personalized suggestions<br/>- Context-aware recommendations]
    end
    
    subgraph "Data Access Layer"
        UserDAO[User DAO]
        OrderDAO[Order DAO]
        SessionDAO[Session DAO]
    end
    
    Express --> SessionRoute
    Express --> ToolsRoute
    Express --> OrdersRoute
    Express --> AnalyticsRoute
    
    SessionRoute --> SessionService
    ToolsRoute --> MenuService
    ToolsRoute --> UserService
    ToolsRoute --> OrderService
    ToolsRoute --> SuggestionService
    OrdersRoute --> OrderService
    AnalyticsRoute --> OrderService
    
    UserService --> UserDAO
    OrderService --> OrderDAO
    SessionService --> SessionDAO
    SuggestionService --> UserDAO
    SuggestionService --> OrderDAO
    
    UserDAO --> SQLite[(SQLite)]
    OrderDAO --> SQLite
    SessionDAO --> SQLite
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        direction TB
        
        subgraph "Authentication"
            Token[Ephemeral Token<br/>OpenAI API]
            Session[Session Management<br/>Unique Session IDs]
        end
        
        subgraph "Authorization"
            CORS[CORS Policy]
            Routes[Protected Routes]
        end
        
        subgraph "Data Protection"
            ENV[Environment Variables<br/>API Keys]
            Validation[Input Validation]
            Sanitization[Data Sanitization]
        end
        
        subgraph "Communication Security"
            WebRTC[WebRTC DTLS/SRTP]
            HTTPS[HTTPS/TLS]
        end
    end
    
    Client[Client] --> CORS
    CORS --> Routes
    Routes --> Token
    Token --> Session
    Session --> Validation
    Validation --> Sanitization
    
    Client -.->|Encrypted| WebRTC
    Client -.->|Encrypted| HTTPS
```

## Technology Stack

```mermaid
graph LR
    subgraph "Frontend"
        HTML[HTML5]
        CSS[Tailwind CSS]
        JS[Vanilla JavaScript]
        WebRTC[WebRTC API]
    end
    
    subgraph "Backend"
        Node[Node.js]
        Express[Express.js]
        SQLite[SQLite3]
    end
    
    subgraph "External APIs"
        OpenAI[OpenAI Realtime API]
    end
    
    subgraph "Protocols"
        HTTP[HTTP/HTTPS]
        WS[WebSockets]
        RTC[WebRTC/DTLS/SRTP]
    end
    
    JS --> WebRTC
    JS --> HTTP
    
    Node --> Express
    Express --> SQLite
    Express --> OpenAI
    
    WebRTC --> RTC
    Express --> HTTP
    OpenAI --> WS
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        
        subgraph "Application Servers"
            Server1[Node.js Server 1]
            Server2[Node.js Server 2]
        end
        
        subgraph "Static Assets"
            CDN[CDN<br/>HTML/CSS/JS]
        end
        
        subgraph "Database"
            Primary[(Primary SQLite)]
            Backup[(Backup SQLite)]
        end
        
        subgraph "External Services"
            OpenAI[OpenAI API]
        end
    end
    
    Client[Client Browser] --> LB
    Client --> CDN
    
    LB --> Server1
    LB --> Server2
    
    Server1 --> Primary
    Server2 --> Primary
    Primary -.->|Replication| Backup
    
    Server1 --> OpenAI
    Server2 --> OpenAI
```

## Key Architectural Decisions

1. **WebRTC for Real-time Voice**: Direct peer-to-peer connection for low-latency audio streaming
2. **SQLite Database**: Lightweight, file-based database suitable for moderate traffic
3. **Stateless Server Design**: Sessions managed via unique IDs, allowing horizontal scaling
4. **Ephemeral Token Pattern**: Secure, time-limited tokens for OpenAI API access
5. **Tool-based Architecture**: Modular function calling system for extensibility
6. **Event-driven Communication**: WebRTC data channel for real-time bidirectional events