# Brew & Byte Café - Flow Diagrams

## Overview
This document provides detailed flow diagrams for the Brew & Byte Café system, illustrating the various processes and data flows throughout the application.

## Main Application Flow

```mermaid
flowchart TD
    Start([User Opens Application])
    
    subgraph "Initialization"
        LoadUI[Load Web Interface]
        CheckEnv[Check Environment]
        InitAgent[Initialize Voice Agent]
    end
    
    subgraph "Connection Flow"
        RequestMic[Request Microphone Access]
        GetToken[Fetch Ephemeral Token]
        EstablishRTC[Establish WebRTC Connection]
        CreateChannels[Create Data & Audio Channels]
    end
    
    subgraph "Session Flow"
        SendConfig[Send Session Configuration]
        ReceiveGreeting[Receive AI Greeting]
        ActiveSession[Active Voice Session]
    end
    
    subgraph "Order Flow"
        VoiceInput[Voice Input]
        ProcessSpeech[Speech Recognition]
        HandleIntent[Process Intent]
        ExecuteFunction[Execute Function Call]
        GenerateResponse[Generate AI Response]
        AudioOutput[Audio Output]
    end
    
    Start --> LoadUI
    LoadUI --> CheckEnv
    CheckEnv --> InitAgent
    InitAgent --> RequestMic
    RequestMic --> GetToken
    GetToken --> EstablishRTC
    EstablishRTC --> CreateChannels
    CreateChannels --> SendConfig
    SendConfig --> ReceiveGreeting
    ReceiveGreeting --> ActiveSession
    
    ActiveSession --> VoiceInput
    VoiceInput --> ProcessSpeech
    ProcessSpeech --> HandleIntent
    HandleIntent --> ExecuteFunction
    ExecuteFunction --> GenerateResponse
    GenerateResponse --> AudioOutput
    AudioOutput --> ActiveSession
```

## Voice Processing Flow

```mermaid
flowchart LR
    subgraph "Audio Input Pipeline"
        Mic[Microphone Input]
        Stream[Media Stream]
        WebRTC[WebRTC Audio Track]
        Encode[Opus Encoding]
        Transport[SRTP Transport]
    end
    
    subgraph "OpenAI Processing"
        VAD[Voice Activity Detection]
        STT[Speech-to-Text]
        NLU[Natural Language Understanding]
        DM[Dialog Management]
        TTS[Text-to-Speech]
    end
    
    subgraph "Audio Output Pipeline"
        Receive[Receive Audio Stream]
        Decode[Opus Decoding]
        AudioEl[Audio Element]
        Speaker[Speaker Output]
    end
    
    Mic --> Stream
    Stream --> WebRTC
    WebRTC --> Encode
    Encode --> Transport
    Transport --> VAD
    VAD --> STT
    STT --> NLU
    NLU --> DM
    DM --> TTS
    TTS --> Receive
    Receive --> Decode
    Decode --> AudioEl
    AudioEl --> Speaker
```

## Function Call Flow

```mermaid
sequenceDiagram
    participant User
    participant Agent
    participant OpenAI
    participant Server
    participant Database
    
    User->>Agent: "I'd like a large latte"
    Agent->>OpenAI: Audio stream
    OpenAI->>OpenAI: Process speech
    OpenAI->>OpenAI: Detect intent (order coffee)
    OpenAI-->>Agent: function_call: fetch_menu
    
    Agent->>Server: GET /api/tools/menu
    Server->>Database: Query menu items
    Database-->>Server: Menu data
    Server-->>Agent: Menu JSON
    Agent-->>OpenAI: Function result
    
    OpenAI->>OpenAI: Process menu data
    OpenAI-->>Agent: function_call: confirm_order
    
    Agent->>Server: POST /api/tools/confirm
    Server->>Server: Calculate total
    Server-->>Agent: Order confirmation
    Agent-->>OpenAI: Function result
    
    OpenAI->>OpenAI: Generate response
    OpenAI-->>Agent: Audio: "That's $4.50 for a large latte"
    Agent-->>User: Play audio response
```

## Order State Machine

```mermaid
stateDiagram-v2
    [*] --> Idle: Session starts
    
    Idle --> IdentifyingUser: User speaks
    
    IdentifyingUser --> UserIdentified: set_user() called
    IdentifyingUser --> Idle: Timeout
    
    UserIdentified --> TakingOrder: Start order
    UserIdentified --> CheckingHistory: User asks for usual
    
    CheckingHistory --> TakingOrder: History retrieved
    
    TakingOrder --> AddingItems: Item specified
    
    AddingItems --> Customizing: Customization needed
    AddingItems --> TakingOrder: More items
    
    Customizing --> AddingItems: Customization complete
    
    TakingOrder --> Confirming: All items added
    
    Confirming --> CalculatingTotal: confirm_order() called
    
    CalculatingTotal --> AwaitingApproval: Total presented
    
    AwaitingApproval --> Submitting: User confirms
    AwaitingApproval --> TakingOrder: User changes order
    
    Submitting --> OrderComplete: submit_order() called
    
    OrderComplete --> Idle: New order
    OrderComplete --> [*]: Session ends
```

## Data Channel Event Flow

```mermaid
flowchart TB
    subgraph "Client to OpenAI"
        SessionUpdate[session.update<br/>Configure AI behavior]
        CreateItem[conversation.item.create<br/>Add user message]
        FunctionOutput[function_call_output<br/>Return function result]
        ResponseCreate[response.create<br/>Trigger AI response]
    end
    
    subgraph "OpenAI to Client"
        SessionCreated[session.created<br/>Session established]
        ItemCreated[conversation.item.created<br/>New conversation item]
        AudioDelta[response.audio_transcript.delta<br/>Incremental transcript]
        AudioDone[response.audio_transcript.done<br/>Complete transcript]
        FunctionCall[response.function_call_arguments.done<br/>Execute function]
        SpeechStarted[input_audio_buffer.speech_started<br/>User speaking]
        SpeechStopped[input_audio_buffer.speech_stopped<br/>User stopped]
    end
    
    subgraph "Processing"
        EventHandler[Event Handler]
        UIUpdater[UI Updater]
        FunctionExecutor[Function Executor]
    end
    
    SessionUpdate --> OpenAI[OpenAI Realtime API]
    CreateItem --> OpenAI
    FunctionOutput --> OpenAI
    ResponseCreate --> OpenAI
    
    OpenAI --> SessionCreated
    OpenAI --> ItemCreated
    OpenAI --> AudioDelta
    OpenAI --> AudioDone
    OpenAI --> FunctionCall
    OpenAI --> SpeechStarted
    OpenAI --> SpeechStopped
    
    SessionCreated --> EventHandler
    ItemCreated --> EventHandler
    AudioDelta --> EventHandler
    AudioDone --> EventHandler
    FunctionCall --> EventHandler
    SpeechStarted --> EventHandler
    SpeechStopped --> EventHandler
    
    EventHandler --> UIUpdater
    EventHandler --> FunctionExecutor
```

## Suggestion Engine Flow

```mermaid
flowchart TD
    subgraph "Input Context"
        UserID[User ID]
        SessionID[Session ID]
        CurrentItem[Current Item]
        ConvContext[Conversation Context]
    end
    
    subgraph "Data Sources"
        UserHistory[User Order History]
        PopularItems[Popular Items]
        TimeBasedTrends[Time-based Trends]
        ItemPairings[Common Pairings]
    end
    
    subgraph "Suggestion Logic"
        AnalyzeContext[Analyze Context]
        ScoreItems[Score Potential Items]
        FilterRelevant[Filter by Relevance]
        GroupByType[Group by Type]
        SortByPriority[Sort by Priority]
    end
    
    subgraph "Output"
        Favorites[User Favorites]
        Variations[Item Variations]
        Trending[Trending Now]
        QuickActions[Quick Actions]
    end
    
    UserID --> AnalyzeContext
    SessionID --> AnalyzeContext
    CurrentItem --> AnalyzeContext
    ConvContext --> AnalyzeContext
    
    UserHistory --> ScoreItems
    PopularItems --> ScoreItems
    TimeBasedTrends --> ScoreItems
    ItemPairings --> ScoreItems
    
    AnalyzeContext --> ScoreItems
    ScoreItems --> FilterRelevant
    FilterRelevant --> GroupByType
    GroupByType --> SortByPriority
    
    SortByPriority --> Favorites
    SortByPriority --> Variations
    SortByPriority --> Trending
    SortByPriority --> QuickActions
```

## Error Recovery Flow

```mermaid
flowchart TD
    Error[Error Detected]
    
    subgraph "Error Types"
        ConnError[Connection Error]
        AuthError[Authentication Error]
        FuncError[Function Error]
        AudioError[Audio Error]
    end
    
    subgraph "Recovery Strategies"
        Retry[Retry Operation]
        Reconnect[Reconnect Session]
        Fallback[Use Fallback]
        NotifyUser[Notify User]
    end
    
    subgraph "Resolution"
        Success[Operation Successful]
        PartialSuccess[Degraded Service]
        Failure[Complete Failure]
    end
    
    Error --> ConnError
    Error --> AuthError
    Error --> FuncError
    Error --> AudioError
    
    ConnError --> Reconnect
    AuthError --> Retry
    FuncError --> Fallback
    AudioError --> NotifyUser
    
    Reconnect --> Success
    Reconnect --> Failure
    Retry --> Success
    Retry --> Failure
    Fallback --> PartialSuccess
    NotifyUser --> PartialSuccess
    
    Success --> Continue[Continue Normal Flow]
    PartialSuccess --> Limited[Limited Functionality]
    Failure --> Terminate[Terminate Session]
```

## Database Transaction Flow

```mermaid
flowchart LR
    subgraph "API Layer"
        Request[API Request]
        Validation[Input Validation]
        Authorization[Check Authorization]
    end
    
    subgraph "Business Logic"
        ProcessLogic[Process Business Rules]
        PrepareQuery[Prepare SQL Query]
    end
    
    subgraph "Data Layer"
        BeginTrans[BEGIN TRANSACTION]
        ExecuteQuery[Execute Query]
        CheckResult{Success?}
        Commit[COMMIT]
        Rollback[ROLLBACK]
    end
    
    subgraph "Response"
        SuccessResp[Success Response]
        ErrorResp[Error Response]
    end
    
    Request --> Validation
    Validation --> Authorization
    Authorization --> ProcessLogic
    ProcessLogic --> PrepareQuery
    PrepareQuery --> BeginTrans
    BeginTrans --> ExecuteQuery
    ExecuteQuery --> CheckResult
    CheckResult -->|Yes| Commit
    CheckResult -->|No| Rollback
    Commit --> SuccessResp
    Rollback --> ErrorResp
```

## Admin Dashboard Flow

```mermaid
flowchart TD
    subgraph "Authentication"
        Login[Admin Login]
        ValidateCreds[Validate Credentials]
        CreateSession[Create Admin Session]
    end
    
    subgraph "Dashboard Views"
        Overview[Overview Dashboard]
        Orders[Order Management]
        Analytics[Analytics View]
        Settings[System Settings]
    end
    
    subgraph "Order Operations"
        ListOrders[List Orders]
        FilterOrders[Apply Filters]
        UpdateOrder[Update Status]
        ViewDetails[View Order Details]
    end
    
    subgraph "Analytics Operations"
        LoadMetrics[Load Metrics]
        GenerateCharts[Generate Charts]
        ExportData[Export Reports]
    end
    
    Login --> ValidateCreds
    ValidateCreds --> CreateSession
    CreateSession --> Overview
    
    Overview --> Orders
    Overview --> Analytics
    Overview --> Settings
    
    Orders --> ListOrders
    ListOrders --> FilterOrders
    ListOrders --> UpdateOrder
    ListOrders --> ViewDetails
    
    Analytics --> LoadMetrics
    LoadMetrics --> GenerateCharts
    LoadMetrics --> ExportData
```

## Real-time Update Flow

```mermaid
sequenceDiagram
    participant Client1
    participant Client2
    participant Server
    participant Database
    participant AdminDashboard
    
    Client1->>Server: Submit Order
    Server->>Database: INSERT order
    Database-->>Server: Order ID
    
    par Notify Client
        Server-->>Client1: Order confirmation
    and Update Analytics
        Server->>Database: Update statistics
    and Notify Admin
        Server-->>AdminDashboard: New order event
    end
    
    AdminDashboard->>AdminDashboard: Update order list
    AdminDashboard->>AdminDashboard: Update metrics
    
    Client2->>Server: Request suggestions
    Server->>Database: Query trending items
    Database-->>Server: Updated trends
    Server-->>Client2: Personalized suggestions
```

## Session Lifecycle Flow

```mermaid
flowchart TD
    subgraph "Session Creation"
        UserConnect[User Connects]
        GenSessionID[Generate Session ID]
        RequestToken[Request Ephemeral Token]
        StoreSession[Store Session Info]
    end
    
    subgraph "Session Active"
        TrackActivity[Track Activity]
        UpdateContext[Update Context]
        MaintainState[Maintain State]
    end
    
    subgraph "Session Termination"
        UserDisconnect[User Disconnects]
        Timeout[Session Timeout]
        SaveState[Save Final State]
        Cleanup[Cleanup Resources]
    end
    
    UserConnect --> GenSessionID
    GenSessionID --> RequestToken
    RequestToken --> StoreSession
    
    StoreSession --> TrackActivity
    TrackActivity --> UpdateContext
    UpdateContext --> MaintainState
    MaintainState --> TrackActivity
    
    MaintainState --> UserDisconnect
    MaintainState --> Timeout
    
    UserDisconnect --> SaveState
    Timeout --> SaveState
    SaveState --> Cleanup
```

## Performance Optimization Flow

```mermaid
flowchart LR
    subgraph "Client Optimizations"
        LazyLoad[Lazy Load Components]
        CacheData[Cache Static Data]
        DebounceInput[Debounce User Input]
    end
    
    subgraph "Network Optimizations"
        CompressData[Compress Responses]
        BatchRequests[Batch API Calls]
        UseWebRTC[WebRTC for Real-time]
    end
    
    subgraph "Server Optimizations"
        ConnectionPool[DB Connection Pool]
        QueryCache[Query Result Cache]
        IndexedQueries[Optimized Indexes]
    end
    
    subgraph "Results"
        ReducedLatency[Reduced Latency]
        ImprovedThroughput[Improved Throughput]
        BetterUX[Better User Experience]
    end
    
    LazyLoad --> ReducedLatency
    CacheData --> ReducedLatency
    DebounceInput --> ImprovedThroughput
    
    CompressData --> ImprovedThroughput
    BatchRequests --> ImprovedThroughput
    UseWebRTC --> ReducedLatency
    
    ConnectionPool --> ImprovedThroughput
    QueryCache --> ReducedLatency
    IndexedQueries --> ReducedLatency
    
    ReducedLatency --> BetterUX
    ImprovedThroughput --> BetterUX
```