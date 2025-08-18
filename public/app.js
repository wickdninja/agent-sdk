// Brew & Byte Café - Vanilla JS Frontend with Agent & Tools

class BrewByteAgent {
    constructor() {
        this.isConnected = false;
        this.messages = [];
        this.currentUserId = null;
        this.currentOrder = { items: [] };
        
        // DOM elements
        this.chatWindow = document.getElementById('chat-window');
        this.chatMessages = document.getElementById('chat-messages');
        this.messageInput = document.getElementById('message-input');
        this.sendButton = document.getElementById('send-button');
        this.connectButton = document.getElementById('connect-button');
        this.disconnectButton = document.getElementById('disconnect-button');
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');
        this.instructions = document.getElementById('instructions');
        this.orderStatus = document.getElementById('order-status');
        
        this.initializeEventListeners();
        this.initializeAgent();
    }
    
    initializeAgent() {
        // Define the tools available to the agent
        this.tools = [
            {
                type: "function",
                name: "fetch_menu",
                description: "Fetch the current menu with all items and prices",
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false
                },
                strict: true
            },
            {
                type: "function",
                name: "set_user",
                description: "Set or create a user account by name",
                parameters: {
                    type: "object",
                    properties: {
                        name: {
                            type: "string",
                            description: "The customer's name"
                        }
                    },
                    required: ["name"],
                    additionalProperties: false
                },
                strict: true
            },
            {
                type: "function",
                name: "confirm_order",
                description: "Calculate the total for the order and confirm with the customer",
                parameters: {
                    type: "object",
                    properties: {
                        items: {
                            type: "array",
                            description: "Array of items in the order",
                            items: {
                                type: "object",
                                properties: {
                                    itemId: {
                                        type: "string",
                                        description: "The ID of the menu item"
                                    },
                                    quantity: {
                                        type: "number",
                                        description: "Number of this item"
                                    },
                                    customizations: {
                                        type: "array",
                                        description: "Array of customization IDs",
                                        items: { type: "string" }
                                    }
                                },
                                required: ["itemId"],
                                additionalProperties: false
                            }
                        }
                    },
                    required: ["items"],
                    additionalProperties: false
                },
                strict: true
            },
            {
                type: "function",
                name: "submit_order",
                description: "Submit the final order for processing",
                parameters: {
                    type: "object",
                    properties: {},
                    required: [],
                    additionalProperties: false
                },
                strict: true
            }
        ];
        
        // Initialize system message for the agent
        this.systemMessage = {
            role: "system",
            content: `You are Bella, a friendly and knowledgeable barista at Brew & Byte Café.

IMPORTANT WORKFLOW:
1. ALWAYS start by warmly greeting the customer and asking for their name
2. Use the set_user function to create or find their account
3. If they're a returning customer, acknowledge this warmly
4. Use fetch_menu function when discussing menu items or prices
5. Take their order, asking about customizations (milk type, syrups, etc.)
6. Use confirm_order function to calculate the total
7. Tell them the total price and ask for confirmation
8. Use submit_order function once they confirm
9. Provide the order number and estimated time

Your personality:
- Warm, welcoming, and enthusiastic about coffee
- Patient with customers who are new to specialty coffee
- Passionate about sharing your coffee knowledge
- A bit quirky and fun, occasionally making coffee puns
- Professional but personable

Order Management:
- Keep track of items as the customer orders them
- Always clarify size, temperature, and customizations
- Suggest complementary items (e.g., pastry with coffee)
- Be clear about pricing, especially for add-ons

When using functions:
- Don't mention that you're "using a function" or "checking the system"
- Integrate the information naturally into conversation
- If a function fails, handle it gracefully without technical details

Remember: Keep the conversation natural and friendly. You're having a real conversation, not reading from a script.`
        };
        
        this.messages = [this.systemMessage];
    }
    
    initializeEventListeners() {
        this.connectButton.addEventListener('click', () => this.connect());
        this.disconnectButton.addEventListener('click', () => this.disconnect());
        this.sendButton.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }
    
    connect() {
        this.isConnected = true;
        this.updateConnectionStatus(true);
        
        // Clear chat and add welcome message
        this.clearChat();
        this.addMessage("Bella", "Hi! Welcome to Brew & Byte Café! I'm Bella, and I'll be helping you today. May I have your name for the order?");
        
        // Enable input
        this.messageInput.disabled = false;
        this.sendButton.disabled = false;
        this.messageInput.focus();
    }
    
    disconnect() {
        this.isConnected = false;
        this.updateConnectionStatus(false);
        
        // Add disconnection message
        this.addMessage("System", "--- Session ended ---", true);
        
        // Disable input
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        this.messageInput.value = '';
        
        // Reset state
        this.currentUserId = null;
        this.currentOrder = { items: [] };
        this.messages = [this.systemMessage];
    }
    
    updateConnectionStatus(connected) {
        if (connected) {
            this.statusIndicator.classList.remove('bg-gray-500');
            this.statusIndicator.classList.add('bg-green-500');
            this.statusDot.classList.remove('bg-gray-300');
            this.statusDot.classList.add('bg-white', 'pulse-animation');
            this.statusText.textContent = 'Connected';
            this.connectButton.classList.add('hidden');
            this.disconnectButton.classList.remove('hidden');
            this.instructions.textContent = 'Type your message to place an order. Bella is ready to help!';
        } else {
            this.statusIndicator.classList.remove('bg-green-500');
            this.statusIndicator.classList.add('bg-gray-500');
            this.statusDot.classList.remove('bg-white', 'pulse-animation');
            this.statusDot.classList.add('bg-gray-300');
            this.statusText.textContent = 'Disconnected';
            this.connectButton.classList.remove('hidden');
            this.disconnectButton.classList.add('hidden');
            this.instructions.textContent = 'Click "Start Chat with Barista" to begin your order';
        }
    }
    
    clearChat() {
        this.chatMessages.innerHTML = '';
    }
    
    addMessage(sender, content, isSystem = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'chat-message';
        
        const messageContent = document.createElement('div');
        
        if (isSystem) {
            messageContent.className = 'text-center text-gray-500 text-sm italic';
            messageContent.textContent = content;
        } else if (sender === 'Bella') {
            messageContent.className = 'p-3 rounded-lg bg-coffee-100 text-coffee-900';
            messageContent.innerHTML = `<strong>Bella:</strong> ${content}`;
        } else if (sender === 'You') {
            messageContent.className = 'p-3 rounded-lg bg-blue-100 text-blue-900 ml-auto max-w-md';
            messageContent.innerHTML = `<strong>You:</strong> ${content}`;
        }
        
        messageDiv.appendChild(messageContent);
        this.chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
    }
    
    async sendMessage() {
        const message = this.messageInput.value.trim();
        if (!message || !this.isConnected) return;
        
        // Add user message to chat
        this.addMessage('You', message);
        
        // Clear input
        this.messageInput.value = '';
        this.messageInput.disabled = true;
        this.sendButton.disabled = true;
        
        // Add user message to conversation history
        this.messages.push({ role: "user", content: message });
        
        try {
            // Send to agent and handle response
            await this.processAgentResponse();
        } catch (error) {
            console.error('Error processing message:', error);
            this.addMessage('System', 'Sorry, there was an error processing your message.', true);
        } finally {
            // Re-enable input
            this.messageInput.disabled = false;
            this.sendButton.disabled = false;
            this.messageInput.focus();
        }
    }
    
    async processAgentResponse() {
        try {
            // Call the agent API
            const response = await fetch('/api/agent/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: this.messages,
                    tools: this.tools
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get response from agent');
            }
            
            const data = await response.json();
            const choice = data.choices[0];
            const message = choice.message;
            
            // Handle tool calls if present
            if (message.tool_calls && message.tool_calls.length > 0) {
                // Add assistant message with tool calls to history
                this.messages.push(message);
                
                // Process each tool call
                for (const toolCall of message.tool_calls) {
                    const functionName = toolCall.function.name;
                    const args = JSON.parse(toolCall.function.arguments);
                    
                    // Execute the tool
                    const result = await this.executeToolCall(functionName, args);
                    
                    // Add tool result to messages
                    this.messages.push({
                        role: "tool",
                        content: JSON.stringify(result),
                        tool_call_id: toolCall.id
                    });
                }
                
                // Get final response after tool execution
                await this.processAgentResponse();
            } else {
                // Regular message response
                if (message.content) {
                    this.addMessage('Bella', message.content);
                    this.messages.push(message);
                }
            }
        } catch (error) {
            console.error('Error in agent response:', error);
            throw error;
        }
    }
    
    async executeToolCall(functionName, args) {
        console.log(`Executing tool: ${functionName}`, args);
        
        try {
            switch (functionName) {
                case 'fetch_menu':
                    const menuResponse = await fetch('/api/tools/menu');
                    return await menuResponse.json();
                
                case 'set_user':
                    const userResponse = await fetch('/api/tools/user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: args.name })
                    });
                    const userData = await userResponse.json();
                    this.currentUserId = userData.userId;
                    return userData;
                
                case 'confirm_order':
                    const confirmResponse = await fetch('/api/tools/confirm', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            items: args.items,
                            userId: this.currentUserId || 'guest'
                        })
                    });
                    const confirmData = await confirmResponse.json();
                    this.currentOrder = { items: args.items, total: confirmData.total };
                    return confirmData;
                
                case 'submit_order':
                    if (!this.currentUserId || !this.currentOrder.items.length) {
                        return { error: 'No order to submit' };
                    }
                    
                    const orderResponse = await fetch('/api/tools/order', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            items: this.currentOrder.items,
                            userId: this.currentUserId,
                            total: this.currentOrder.total
                        })
                    });
                    const orderData = await orderResponse.json();
                    
                    // Show order status
                    this.showOrderStatus(orderData);
                    
                    // Clear current order
                    this.currentOrder = { items: [] };
                    
                    return orderData;
                
                default:
                    return { error: `Unknown function: ${functionName}` };
            }
        } catch (error) {
            console.error(`Error executing tool ${functionName}:`, error);
            return { error: `Failed to execute ${functionName}` };
        }
    }
    
    showOrderStatus(orderData) {
        const orderStatus = document.getElementById('order-status');
        const orderId = document.getElementById('order-id');
        const orderStatusText = document.getElementById('order-status-text');
        const orderTime = document.getElementById('order-time');
        
        orderId.textContent = orderData.orderId;
        orderStatusText.textContent = orderData.status;
        orderTime.textContent = orderData.estimatedTime;
        
        orderStatus.classList.remove('hidden');
        
        // Hide after 10 seconds
        setTimeout(() => {
            orderStatus.classList.add('hidden');
        }, 10000);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BrewByteAgent();
});