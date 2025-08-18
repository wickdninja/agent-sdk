# Brew & Byte Café - Data Model

## Overview
This document describes the data model and database schema for the Brew & Byte Café system, including entity relationships, data structures, and storage patterns.

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ SESSIONS : has
    ORDERS ||--|{ ORDER_ITEMS : contains
    SESSIONS }o--|| USERS : belongs_to
    
    USERS {
        string id PK
        string name
        string phone
        json preferences
        datetime created_at
        datetime updated_at
    }
    
    ORDERS {
        int id PK
        string user_id FK
        json items
        float total
        string status
        datetime created_at
        datetime updated_at
    }
    
    ORDER_ITEMS {
        int id PK
        int order_id FK
        string item_name
        string category
        string subcategory
        string size
        string temperature
        float price
        int quantity
        json customizations
    }
    
    SESSIONS {
        string id PK
        string user_id FK
        json context
        json user_info
        datetime created_at
        datetime last_activity
    }
```

## Database Schema Details

### Users Table

```mermaid
graph TB
    subgraph "USERS Table"
        id[id: TEXT PRIMARY KEY<br/>UUID format]
        name[name: TEXT NOT NULL<br/>Customer name]
        phone[phone: TEXT<br/>Optional phone number]
        preferences[preferences: TEXT<br/>JSON preferences object]
        created_at[created_at: DATETIME<br/>Account creation time]
        updated_at[updated_at: DATETIME<br/>Last update time]
    end
    
    subgraph "Preferences JSON Structure"
        favorite_items[favorite_items: array<br/>List of preferred items]
        dietary[dietary_restrictions: object<br/>Allergies, preferences]
        default_custom[default_customizations: object<br/>Preferred milk, size, etc]
    end
    
    preferences -.->|contains| favorite_items
    preferences -.->|contains| dietary
    preferences -.->|contains| default_custom
```

### Orders Table

```mermaid
graph TB
    subgraph "ORDERS Table"
        order_id[id: INTEGER PRIMARY KEY<br/>Auto-increment]
        user_id[user_id: TEXT NOT NULL<br/>Foreign key to USERS]
        items[items: TEXT NOT NULL<br/>JSON array of items]
        total[total: REAL NOT NULL<br/>Order total amount]
        status[status: TEXT<br/>pending|preparing|ready|completed]
        order_created[created_at: DATETIME<br/>Order placement time]
        order_updated[updated_at: DATETIME<br/>Last status update]
    end
    
    subgraph "Status Transitions"
        pending[pending<br/>Initial state]
        preparing[preparing<br/>Being made]
        ready[ready<br/>Ready for pickup]
        completed[completed<br/>Order fulfilled]
        cancelled[cancelled<br/>Order cancelled]
    end
    
    pending --> preparing
    preparing --> ready
    ready --> completed
    pending --> cancelled
    preparing --> cancelled
```

### Order Items Table

```mermaid
graph LR
    subgraph "ORDER_ITEMS Table"
        item_id[id: INTEGER PK]
        order_ref[order_id: INTEGER FK]
        item_name[item_name: TEXT]
        category[category: TEXT]
        subcategory[subcategory: TEXT]
        size[size: TEXT]
        temperature[temperature: TEXT]
        price[price: REAL]
        quantity[quantity: INTEGER]
        customizations[customizations: TEXT/JSON]
    end
    
    subgraph "Customizations JSON"
        milk_type[milk_type: string]
        syrups[syrups: array]
        extras[extras: array]
        special[special_instructions: string]
    end
    
    customizations -.->|contains| milk_type
    customizations -.->|contains| syrups
    customizations -.->|contains| extras
    customizations -.->|contains| special
```

### Sessions Table

```mermaid
graph TB
    subgraph "SESSIONS Table"
        session_id[id: TEXT PRIMARY KEY<br/>Unique session identifier]
        session_user[user_id: TEXT<br/>Foreign key to USERS]
        context[context: TEXT<br/>JSON conversation context]
        user_info[user_info: TEXT<br/>JSON user information]
        session_created[created_at: DATETIME<br/>Session start time]
        last_activity[last_activity: DATETIME<br/>Last interaction time]
    end
    
    subgraph "Context JSON Structure"
        current_order[current_order: object<br/>Order being built]
        conversation_state[conversation_state: string<br/>Current dialog state]
        mentioned_items[mentioned_items: array<br/>Items discussed]
        user_preferences[user_preferences: object<br/>Session preferences]
    end
    
    context -.->|contains| current_order
    context -.->|contains| conversation_state
    context -.->|contains| mentioned_items
    context -.->|contains| user_preferences
```

## Menu Data Structure

```mermaid
graph TD
    subgraph "Menu Structure (menu.js)"
        Menu[Menu Object]
        Categories[Categories Array]
        Items[Items Array]
        Customizations[Customizations Object]
    end
    
    subgraph "Category Structure"
        cat_id[id: string]
        cat_name[name: string]
        cat_desc[description: string]
        subcategories[subcategories: array]
    end
    
    subgraph "Item Structure"
        item_id[id: string]
        item_name[name: string]
        item_cat[category: string]
        item_subcat[subcategory: string]
        item_desc[description: string]
        base_price[base_price: number]
        sizes[sizes: object]
        available[available: boolean]
        popular[popular: boolean]
        seasonal[seasonal: boolean]
    end
    
    subgraph "Customization Structure"
        milk_options[milk_options: array]
        syrup_options[syrup_options: array]
        temperature_options[temperature_options: array]
        size_options[size_options: array]
        extras[extras: array]
    end
    
    Menu --> Categories
    Menu --> Items
    Menu --> Customizations
    
    Categories --> cat_id
    Categories --> cat_name
    Categories --> cat_desc
    Categories --> subcategories
    
    Items --> item_id
    Items --> item_name
    Items --> item_cat
    Items --> item_subcat
    Items --> item_desc
    Items --> base_price
    Items --> sizes
    Items --> available
    Items --> popular
    Items --> seasonal
    
    Customizations --> milk_options
    Customizations --> syrup_options
    Customizations --> temperature_options
    Customizations --> size_options
    Customizations --> extras
```

## Data Access Patterns

### User Management

```mermaid
flowchart LR
    subgraph "User Operations"
        FindUser[Find User by Name]
        CreateUser[Create New User]
        UpdateUser[Update User Info]
        GetHistory[Get Order History]
    end
    
    subgraph "Query Patterns"
        ExactMatch[SELECT * FROM users<br/>WHERE LOWER(name) = ?]
        PartialMatch[SELECT * FROM users<br/>WHERE name LIKE ?]
        InsertUser[INSERT INTO users<br/>(id, name, ...)]
        UpdatePref[UPDATE users<br/>SET preferences = ?]
        JoinOrders[SELECT * FROM orders<br/>WHERE user_id = ?]
    end
    
    FindUser --> ExactMatch
    FindUser --> PartialMatch
    CreateUser --> InsertUser
    UpdateUser --> UpdatePref
    GetHistory --> JoinOrders
```

### Order Processing

```mermaid
flowchart TD
    subgraph "Order Operations"
        CreateOrder[Create Order]
        AddItems[Add Order Items]
        UpdateStatus[Update Order Status]
        GetOrderDetails[Get Order Details]
    end
    
    subgraph "Transaction Flow"
        Begin[BEGIN TRANSACTION]
        InsertOrder[INSERT INTO orders]
        GetOrderId[Get Last Insert ID]
        InsertItems[INSERT INTO order_items<br/>Multiple rows]
        Commit[COMMIT]
        Rollback[ROLLBACK on error]
    end
    
    CreateOrder --> Begin
    Begin --> InsertOrder
    InsertOrder --> GetOrderId
    GetOrderId --> InsertItems
    InsertItems --> Commit
    InsertItems --> Rollback
```

## Indexing Strategy

```mermaid
graph TB
    subgraph "Database Indexes"
        UserIndexes[User Indexes]
        OrderIndexes[Order Indexes]
        SessionIndexes[Session Indexes]
    end
    
    subgraph "User Table Indexes"
        idx_user_name[idx_users_name<br/>For name lookups]
        idx_user_phone[idx_users_phone<br/>For phone lookups]
    end
    
    subgraph "Order Table Indexes"
        idx_order_user[idx_orders_user_id<br/>For user orders]
        idx_order_status[idx_orders_status<br/>For status filtering]
        idx_order_created[idx_orders_created_at<br/>For time queries]
    end
    
    subgraph "Session Table Indexes"
        idx_session_user[idx_sessions_user_id<br/>For user sessions]
        idx_session_activity[idx_sessions_last_activity<br/>For cleanup]
    end
    
    UserIndexes --> idx_user_name
    UserIndexes --> idx_user_phone
    
    OrderIndexes --> idx_order_user
    OrderIndexes --> idx_order_status
    OrderIndexes --> idx_order_created
    
    SessionIndexes --> idx_session_user
    SessionIndexes --> idx_session_activity
```

## Data Lifecycle

### Session Data Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: New session
    Created --> Active: User identified
    Active --> Updated: Context changes
    Updated --> Active: Continue session
    Active --> Inactive: No activity
    Inactive --> Active: User returns
    Inactive --> Expired: Timeout (30 min)
    Active --> Completed: Order placed
    Completed --> Archived: After 24 hours
    Expired --> Cleaned: Cleanup job
    Archived --> [*]
    Cleaned --> [*]
```

### Order Data Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Items added
    Draft --> Confirmed: User confirms
    Confirmed --> Pending: Payment processed
    Pending --> Preparing: Barista starts
    Preparing --> Ready: Order complete
    Ready --> PickedUp: Customer collects
    PickedUp --> Completed: Transaction done
    Completed --> Archived: After 30 days
    Archived --> [*]
    
    Draft --> Cancelled: User cancels
    Pending --> Cancelled: System cancels
    Preparing --> Cancelled: Issue detected
    Cancelled --> [*]
```

## Analytics Data Model

```mermaid
graph TB
    subgraph "Aggregated Metrics"
        DailySales[Daily Sales]
        ProductMetrics[Product Metrics]
        CustomerMetrics[Customer Metrics]
        PeakHours[Peak Hours]
    end
    
    subgraph "Daily Sales Structure"
        date[date: DATE]
        total_orders[total_orders: INTEGER]
        total_revenue[total_revenue: REAL]
        avg_order_value[avg_order_value: REAL]
        unique_customers[unique_customers: INTEGER]
    end
    
    subgraph "Product Metrics Structure"
        product_id[product_id: STRING]
        product_name[product_name: STRING]
        units_sold[units_sold: INTEGER]
        revenue[revenue: REAL]
        popularity_rank[popularity_rank: INTEGER]
    end
    
    subgraph "Customer Metrics Structure"
        customer_id[customer_id: STRING]
        order_count[order_count: INTEGER]
        total_spent[total_spent: REAL]
        avg_order[avg_order_value: REAL]
        favorite_item[favorite_item: STRING]
        last_order[last_order_date: DATE]
    end
    
    DailySales --> date
    DailySales --> total_orders
    DailySales --> total_revenue
    DailySales --> avg_order_value
    DailySales --> unique_customers
    
    ProductMetrics --> product_id
    ProductMetrics --> product_name
    ProductMetrics --> units_sold
    ProductMetrics --> revenue
    ProductMetrics --> popularity_rank
    
    CustomerMetrics --> customer_id
    CustomerMetrics --> order_count
    CustomerMetrics --> total_spent
    CustomerMetrics --> avg_order
    CustomerMetrics --> favorite_item
    CustomerMetrics --> last_order
```

## Caching Strategy

```mermaid
flowchart LR
    subgraph "Cache Layers"
        MemCache[In-Memory Cache]
        SessionCache[Session Cache]
        QueryCache[Query Result Cache]
    end
    
    subgraph "Cached Data"
        MenuData[Menu Data<br/>TTL: 1 hour]
        UserPrefs[User Preferences<br/>TTL: 15 min]
        PopularItems[Popular Items<br/>TTL: 5 min]
        Suggestions[Suggestions<br/>TTL: 30 sec]
    end
    
    subgraph "Cache Invalidation"
        TimeBasedTTL[Time-based TTL]
        EventBased[Event-based]
        Manual[Manual Flush]
    end
    
    MemCache --> MenuData
    SessionCache --> UserPrefs
    QueryCache --> PopularItems
    QueryCache --> Suggestions
    
    MenuData --> TimeBasedTTL
    UserPrefs --> EventBased
    PopularItems --> TimeBasedTTL
    Suggestions --> TimeBasedTTL
    
    EventBased --> Manual
```

## Data Validation Rules

```mermaid
graph TD
    subgraph "Input Validation"
        UserInput[User Input]
        OrderInput[Order Input]
        SessionInput[Session Input]
    end
    
    subgraph "User Validation Rules"
        NameLength[Name: 2-50 characters]
        NameFormat[Name: Letters and spaces only]
        PhoneFormat[Phone: Valid format]
        PrefsJSON[Preferences: Valid JSON]
    end
    
    subgraph "Order Validation Rules"
        ItemsArray[Items: Non-empty array]
        ItemIds[Item IDs: Valid menu items]
        Quantities[Quantities: Positive integers]
        TotalCalc[Total: Matches calculation]
    end
    
    subgraph "Session Validation Rules"
        SessionID[Session ID: UUID format]
        UserRef[User ID: Exists in database]
        ContextJSON[Context: Valid JSON]
        ActivityTime[Activity: Recent timestamp]
    end
    
    UserInput --> NameLength
    UserInput --> NameFormat
    UserInput --> PhoneFormat
    UserInput --> PrefsJSON
    
    OrderInput --> ItemsArray
    OrderInput --> ItemIds
    OrderInput --> Quantities
    OrderInput --> TotalCalc
    
    SessionInput --> SessionID
    SessionInput --> UserRef
    SessionInput --> ContextJSON
    SessionInput --> ActivityTime
```

## Data Migration Strategy

```mermaid
flowchart TD
    subgraph "Migration Process"
        V1[Version 1 Schema]
        Migration1[Migration Script 1]
        V2[Version 2 Schema]
        Migration2[Migration Script 2]
        V3[Version 3 Schema]
    end
    
    subgraph "Migration Steps"
        Backup[Backup Database]
        Validate[Validate Current Schema]
        Apply[Apply Migration]
        Verify[Verify Data Integrity]
        Rollback[Rollback if Failed]
    end
    
    V1 --> Migration1
    Migration1 --> V2
    V2 --> Migration2
    Migration2 --> V3
    
    Backup --> Validate
    Validate --> Apply
    Apply --> Verify
    Verify -->|Success| Complete[Migration Complete]
    Verify -->|Failure| Rollback
```