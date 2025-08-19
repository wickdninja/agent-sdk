# Brew & Byte Café - Use Cases

## Overview
This document outlines the primary use cases for the Brew & Byte Café voice ordering system, detailing actor interactions and system behaviors.

## Actors

```mermaid
graph TB
    subgraph "System Actors"
        Customer[Customer<br/>Places orders via voice]
        Bella[Bella AI Agent<br/>Virtual barista]
        Admin[Administrator<br/>Manages orders & analytics]
        System[System<br/>Automated processes]
    end
    
    subgraph "External Systems"
        OpenAI[OpenAI Realtime API<br/>Voice processing]
        Database[(Database<br/>Data persistence)]
    end
    
    Customer -.->|interacts| Bella
    Bella -.->|uses| OpenAI
    Admin -.->|manages| System
    System -.->|stores| Database
```

## Primary Use Cases

### UC1: Place Voice Order

```mermaid
graph TD
    Start([Customer wants coffee])
    
    subgraph "Voice Order Flow"
        Connect[Connect to voice agent]
        Greet[Agent greets customer]
        GetName[Agent asks for name]
        CheckUser{Returning<br/>customer?}
        Welcome[Welcome back message]
        NewUser[Create new account]
        ShowUsual[Offer usual order]
        TakeOrder[Take new order]
        Customize[Handle customizations]
        Confirm[Confirm order details]
        Calculate[Calculate total]
        Submit[Submit order]
        OrderNum[Provide order number]
    end
    
    Start --> Connect
    Connect --> Greet
    Greet --> GetName
    GetName --> CheckUser
    CheckUser -->|Yes| Welcome
    CheckUser -->|No| NewUser
    Welcome --> ShowUsual
    NewUser --> TakeOrder
    ShowUsual -->|Accept| Confirm
    ShowUsual -->|Decline| TakeOrder
    TakeOrder --> Customize
    Customize --> Confirm
    Confirm --> Calculate
    Calculate --> Submit
    Submit --> OrderNum
    OrderNum --> End([Order complete])
```

### UC2: Returning Customer Experience

```mermaid
sequenceDiagram
    participant Customer
    participant Bella
    participant System
    participant Database
    
    Customer->>Bella: "Hi, I'd like to order"
    Bella->>Customer: "Welcome! What's your name?"
    Customer->>Bella: "It's John"
    
    Bella->>System: set_user("John")
    System->>Database: Find user by name
    Database-->>System: User found (3 previous orders)
    System-->>Bella: User details + history
    
    Bella->>Customer: "Welcome back, John! Great to see you again!"
    Bella->>Customer: "Would you like your usual - Large Cappuccino with oat milk?"
    
    alt Customer accepts usual
        Customer->>Bella: "Yes, that sounds perfect"
        Bella->>System: confirm_order(usual_items)
    else Customer wants something different
        Customer->>Bella: "Actually, I'll try something new"
        Bella->>Customer: "Of course! What would you like?"
        Customer->>Bella: States new order
        Bella->>System: confirm_order(new_items)
    end
    
    System->>Database: Create order record
    Database-->>System: Order ID generated
    System-->>Bella: Order confirmed
    Bella->>Customer: "Order #1234 confirmed! It'll be ready in 5 minutes"
```

### UC3: Order Customization

```mermaid
graph LR
    subgraph "Customization Options"
        Size[Size Selection<br/>Small/Medium/Large]
        Temp[Temperature<br/>Hot/Iced]
        Milk[Milk Type<br/>Whole/Skim/Oat/Almond/Soy]
        Syrup[Syrup Flavors<br/>Vanilla/Caramel/Hazelnut]
        Extra[Extra Options<br/>Extra shot/Decaf/Whipped cream]
    end
    
    subgraph "Customization Flow"
        Start[Base drink selected]
        Ask[Agent asks preferences]
        Specify[Customer specifies]
        Validate[Validate combination]
        Price[Update pricing]
        Confirm[Confirm customization]
    end
    
    Start --> Ask
    Ask --> Size
    Ask --> Temp
    Ask --> Milk
    Ask --> Syrup
    Ask --> Extra
    
    Size --> Specify
    Temp --> Specify
    Milk --> Specify
    Syrup --> Specify
    Extra --> Specify
    
    Specify --> Validate
    Validate --> Price
    Price --> Confirm
```

### UC4: Admin Dashboard Operations

```mermaid
graph TB
    subgraph "Admin Use Cases"
        Login[Admin Login]
        
        subgraph "Order Management"
            ViewOrders[View All Orders]
            FilterOrders[Filter by Status]
            UpdateStatus[Update Order Status]
            ViewDetails[View Order Details]
        end
        
        subgraph "Analytics"
            ViewStats[View Statistics]
            Revenue[Revenue Reports]
            Popular[Popular Items]
            Customer[Customer Analytics]
        end
        
        subgraph "System Management"
            ViewSessions[View Active Sessions]
            ViewErrors[View Error Logs]
            Export[Export Data]
        end
    end
    
    Login --> ViewOrders
    Login --> ViewStats
    Login --> ViewSessions
    
    ViewOrders --> FilterOrders
    ViewOrders --> UpdateStatus
    ViewOrders --> ViewDetails
    
    ViewStats --> Revenue
    ViewStats --> Popular
    ViewStats --> Customer
```

### UC5: Intelligent Suggestions

```mermaid
sequenceDiagram
    participant Customer
    participant Bella
    participant SuggestionEngine
    participant Database
    
    Note over SuggestionEngine: Continuous context analysis
    
    Customer->>Bella: "I'll have a latte"
    Bella->>SuggestionEngine: Update context (item: latte)
    
    SuggestionEngine->>Database: Get user preferences
    SuggestionEngine->>Database: Get popular pairings
    SuggestionEngine->>Database: Get time-based trends
    
    Database-->>SuggestionEngine: Historical data
    
    SuggestionEngine->>SuggestionEngine: Generate suggestions:<br/>1. "Add vanilla syrup?"<br/>2. "Make it iced?"<br/>3. "Add a croissant?"
    
    SuggestionEngine-->>Bella: Contextual suggestions
    
    Bella->>Customer: "Would you like to add a fresh croissant?<br/>They go perfectly with lattes!"
    
    alt Customer accepts
        Customer->>Bella: "Sure, add a croissant"
        Bella->>SuggestionEngine: Update context (accepted: croissant)
    else Customer declines
        Customer->>Bella: "No thanks"
        Bella->>SuggestionEngine: Update context (declined: croissant)
    end
```

## Error Handling Use Cases

### UC6: Connection Failure Recovery

```mermaid
stateDiagram-v2
    [*] --> Connecting: User starts order
    
    Connecting --> Connected: Success
    Connecting --> ConnectionFailed: Timeout/Error
    
    Connected --> Active: Session established
    Active --> Disconnected: Connection lost
    
    ConnectionFailed --> Retry: Auto-retry
    Retry --> Connecting: Attempt reconnection
    Retry --> Failed: Max retries exceeded
    
    Disconnected --> Reconnecting: Auto-reconnect
    Reconnecting --> Active: Restored
    Reconnecting --> Failed: Cannot restore
    
    Failed --> [*]: Show error message
    Active --> OrderComplete: Order submitted
    OrderComplete --> [*]: Session ends
```

### UC7: Speech Recognition Challenges

```mermaid
graph TD
    subgraph "Speech Recognition Handling"
        Start[Customer speaks]
        
        Process[Process audio]
        Confidence{Confidence<br/>level?}
        
        High[Proceed with order]
        Medium[Ask for confirmation]
        Low[Ask to repeat]
        
        NoSpeech{Detected<br/>speech?}
        Prompt[Prompt customer]
        Timeout{Response<br/>timeout?}
        
        End[Continue conversation]
        Disconnect[End session]
    end
    
    Start --> Process
    Process --> NoSpeech
    NoSpeech -->|No| Prompt
    NoSpeech -->|Yes| Confidence
    
    Confidence -->|High| High
    Confidence -->|Medium| Medium
    Confidence -->|Low| Low
    
    High --> End
    Medium --> End
    Low --> Prompt
    
    Prompt --> Timeout
    Timeout -->|No| Process
    Timeout -->|Yes| Disconnect
```

## Business Process Use Cases

### UC8: Order Fulfillment Workflow

```mermaid
graph LR
    subgraph "Order Lifecycle"
        Created[Order Created]
        Confirmed[Order Confirmed]
        Preparing[Being Prepared]
        Ready[Ready for Pickup]
        Completed[Order Completed]
        Cancelled[Order Cancelled]
    end
    
    Created --> Confirmed
    Confirmed --> Preparing
    Confirmed --> Cancelled
    Preparing --> Ready
    Preparing --> Cancelled
    Ready --> Completed
    
    style Created fill:#e1f5e1
    style Confirmed fill:#fff3cd
    style Preparing fill:#cfe2ff
    style Ready fill:#d1ecf1
    style Completed fill:#d4edda
    style Cancelled fill:#f8d7da
```

### UC9: Analytics and Reporting

```mermaid
graph TB
    subgraph "Analytics Use Cases"
        DataCollection[Continuous Data Collection]
        
        subgraph "Real-time Analytics"
            ActiveOrders[Active Orders Count]
            CurrentRevenue[Today's Revenue]
            QueueTime[Average Wait Time]
        end
        
        subgraph "Historical Analytics"
            DailyReports[Daily Sales Reports]
            ProductAnalysis[Product Performance]
            CustomerPatterns[Customer Patterns]
            PeakHours[Peak Hour Analysis]
        end
        
        subgraph "Predictive Analytics"
            DemandForecast[Demand Forecasting]
            InventoryPlan[Inventory Planning]
            StaffSchedule[Staff Scheduling]
        end
    end
    
    DataCollection --> ActiveOrders
    DataCollection --> DailyReports
    DataCollection --> DemandForecast
    
    DailyReports --> ProductAnalysis
    DailyReports --> CustomerPatterns
    CustomerPatterns --> PeakHours
    
    PeakHours --> StaffSchedule
    ProductAnalysis --> InventoryPlan
```

## Integration Use Cases

### UC10: Multi-channel Order Integration

```mermaid
graph TD
    subgraph "Order Channels"
        Voice[Voice Orders<br/>via Bella]
        Web[Web Orders<br/>via UI]
        Admin[Manual Orders<br/>via Admin]
    end
    
    subgraph "Order Processing"
        Queue[Central Order Queue]
        Process[Order Processor]
        Fulfillment[Fulfillment System]
    end
    
    subgraph "Customer Touchpoints"
        Notification[Order Notifications]
        Status[Status Updates]
        Pickup[Pickup Alert]
    end
    
    Voice --> Queue
    Web --> Queue
    Admin --> Queue
    
    Queue --> Process
    Process --> Fulfillment
    
    Fulfillment --> Notification
    Fulfillment --> Status
    Fulfillment --> Pickup
```

## Exception Cases

### UC11: Handling Edge Cases

```mermaid
graph TD
    subgraph "Edge Case Scenarios"
        Unknown[Unknown Menu Item]
        Unavailable[Item Unavailable]
        Complex[Complex Custom Order]
        Multiple[Multiple Modifications]
        Cancel[Mid-order Cancellation]
        Change[Order Changes]
    end
    
    subgraph "Resolution Strategies"
        Suggest[Suggest Alternatives]
        Clarify[Request Clarification]
        Confirm[Extra Confirmation]
        Summary[Order Summary]
        Reset[Reset Order]
        Update[Update Order]
    end
    
    Unknown --> Suggest
    Unavailable --> Suggest
    Complex --> Clarify
    Multiple --> Confirm
    Cancel --> Reset
    Change --> Update
    
    Suggest --> Summary
    Clarify --> Summary
    Confirm --> Summary
    Update --> Summary
```

## User Journey Maps

### New Customer Journey

```mermaid
journey
    title New Customer Order Journey
    
    section Discovery
      Visit website: 5: Customer
      See voice order option: 4: Customer
      Click "Start Order": 5: Customer
    
    section First Interaction
      Grant microphone access: 3: Customer
      Hear greeting from Bella: 5: Customer
      Provide name: 4: Customer
      Account created: 5: System
    
    section Ordering
      Browse menu verbally: 4: Customer
      Ask questions: 5: Customer
      Receive recommendations: 5: Bella
      Make selection: 4: Customer
      Customize order: 4: Customer
    
    section Completion
      Hear total price: 4: Customer
      Confirm order: 5: Customer
      Receive order number: 5: Customer
      Wait for preparation: 3: Customer
      Pick up order: 5: Customer
```

### Returning Customer Journey

```mermaid
journey
    title Returning Customer Order Journey
    
    section Recognition
      Click "Start Order": 5: Customer
      Say name: 5: Customer
      Recognized by system: 5: Bella
      Welcomed back: 5: Bella
    
    section Quick Order
      Offered usual order: 5: Bella
      Accept suggestion: 5: Customer
      Skip customization: 5: System
    
    section Checkout
      Quick confirmation: 5: Customer
      Instant processing: 5: System
      Order submitted: 5: System
    
    section Fulfillment
      Receive order number: 5: Customer
      Shorter wait time: 4: Customer
      Pick up order: 5: Customer
```