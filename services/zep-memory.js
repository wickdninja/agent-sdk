const { Zep } = require('@getzep/zep-cloud');
const { v4: uuidv4 } = require('uuid');

class ZepMemoryService {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('Zep API key is required');
        }
        
        // Initialize Zep with API key
        this.apiKey = apiKey;
        this.client = Zep;
        
        // Cache for active threads
        this.activeThreads = new Map();
        
        // Cache for user contexts
        this.contextCache = new Map();
        
        console.log('✅ Zep Memory Service initialized');
    }
    
    /**
     * Create or retrieve a user in Zep
     */
    async ensureUser(userId, userData = {}) {
        try {
            // Try to get existing user first
            try {
                const existingUser = await this.client.user.get(userId, {
                    apiKey: this.apiKey
                });
                console.log(`[Zep] Retrieved existing user: ${userId}`);
                
                // Update user metadata if provided
                if (Object.keys(userData).length > 0) {
                    await this.client.user.update(userId, {
                        metadata: {
                            ...existingUser.metadata,
                            ...userData.metadata,
                            lastSeen: new Date().toISOString()
                        }
                    }, {
                        apiKey: this.apiKey
                    });
                }
                
                return existingUser;
            } catch (error) {
                // User doesn't exist, create new one
                console.log(`[Zep] Creating new user: ${userId}`);
                const newUser = await this.client.user.add({
                    userId: userId,
                    email: userData.email || `${userId}@brewbyte.cafe`,
                    firstName: userData.firstName || userData.name || 'Customer',
                    lastName: userData.lastName || '',
                    metadata: {
                        ...userData.metadata,
                        createdAt: new Date().toISOString(),
                        lastSeen: new Date().toISOString(),
                        source: 'voice-agent'
                    }
                }, {
                    apiKey: this.apiKey
                });
                
                return newUser;
            }
        } catch (error) {
            console.error('[Zep] Error ensuring user:', error);
            throw error;
        }
    }
    
    /**
     * Create a new conversation thread
     */
    async createThread(userId, sessionId) {
        try {
            const threadId = sessionId || uuidv4();
            
            await this.client.thread.add({
                threadId: threadId,
                userId: userId,
                name: `Coffee Order Session - ${new Date().toLocaleDateString()}`,
                metadata: {
                    type: 'voice_conversation',
                    channel: 'webrtc',
                    startedAt: new Date().toISOString()
                }
            }, {
                apiKey: this.apiKey
            });
            
            this.activeThreads.set(userId, threadId);
            console.log(`[Zep] Created thread: ${threadId} for user: ${userId}`);
            
            return threadId;
        } catch (error) {
            console.error('[Zep] Error creating thread:', error);
            throw error;
        }
    }
    
    /**
     * Add a message to the conversation thread
     */
    async addMessage(userId, message, role = 'user', metadata = {}) {
        try {
            const threadId = this.activeThreads.get(userId);
            if (!threadId) {
                console.warn(`[Zep] No active thread for user: ${userId}`);
                return null;
            }
            
            const zepMessage = {
                content: message,
                role: role,
                name: role === 'user' ? userId : 'Bella',
                metadata: {
                    ...metadata,
                    timestamp: new Date().toISOString()
                }
            };
            
            await this.client.thread.addMessages(threadId, [zepMessage], {
                apiKey: this.apiKey
            });
            console.log(`[Zep] Added ${role} message to thread: ${threadId}`);
            
            // Clear context cache for this user to force refresh
            this.contextCache.delete(userId);
            
            return true;
        } catch (error) {
            console.error('[Zep] Error adding message:', error);
            return false;
        }
    }
    
    /**
     * Add multiple messages in batch
     */
    async addMessages(userId, messages) {
        try {
            const threadId = this.activeThreads.get(userId);
            if (!threadId) {
                console.warn(`[Zep] No active thread for user: ${userId}`);
                return null;
            }
            
            const zepMessages = messages.map(msg => ({
                content: msg.content,
                role: msg.role,
                name: msg.role === 'user' ? userId : 'Bella',
                metadata: {
                    ...msg.metadata,
                    timestamp: msg.timestamp || new Date().toISOString()
                }
            }));
            
            await this.client.thread.addMessages(threadId, zepMessages, {
                apiKey: this.apiKey
            });
            console.log(`[Zep] Added ${messages.length} messages to thread: ${threadId}`);
            
            // Clear context cache
            this.contextCache.delete(userId);
            
            return true;
        } catch (error) {
            console.error('[Zep] Error adding messages:', error);
            return false;
        }
    }
    
    /**
     * Get enriched context for the user
     */
    async getUserContext(userId, useCache = true) {
        try {
            // Check cache first
            if (useCache && this.contextCache.has(userId)) {
                const cached = this.contextCache.get(userId);
                if (Date.now() - cached.timestamp < 30000) { // 30 second cache
                    console.log(`[Zep] Using cached context for user: ${userId}`);
                    return cached.context;
                }
            }
            
            const threadId = this.activeThreads.get(userId);
            if (!threadId) {
                console.warn(`[Zep] No active thread for user: ${userId}`);
                return null;
            }
            
            // Get user context with facts and entities
            const memory = await this.client.thread.getUserContext(threadId, {
                apiKey: this.apiKey
            });
            
            // Cache the context
            this.contextCache.set(userId, {
                context: memory,
                timestamp: Date.now()
            });
            
            console.log(`[Zep] Retrieved context for user: ${userId}`);
            return memory;
        } catch (error) {
            console.error('[Zep] Error getting user context:', error);
            return null;
        }
    }
    
    /**
     * Add business facts to user's graph
     */
    async addUserFacts(userId, facts) {
        try {
            if (!Array.isArray(facts)) {
                facts = [facts];
            }
            
            // Format facts as text data for graph
            const factsText = facts.map(fact => {
                const factString = fact.fact || fact;
                const rating = fact.rating || 1.0;
                return `[${rating}] ${factString}`;
            }).join('\n');
            
            // Add to graph as text data
            await this.client.graph.add({
                userId: userId,
                type: 'text',
                data: factsText
            }, {
                apiKey: this.apiKey
            });
            
            console.log(`[Zep] Added ${facts.length} facts for user: ${userId}`);
            
            // Clear context cache
            this.contextCache.delete(userId);
            
            return true;
        } catch (error) {
            console.error('[Zep] Error adding user facts:', error);
            return false;
        }
    }
    
    /**
     * Update order-related facts
     */
    async updateOrderFacts(userId, orderData) {
        try {
            const facts = [];
            
            // Add order items as facts
            if (orderData.items && orderData.items.length > 0) {
                orderData.items.forEach(item => {
                    facts.push({
                        fact: `Ordered ${item.quantity || 1}x ${item.name || item.itemId}`,
                        created_at: new Date().toISOString(),
                        rating: 1.0
                    });
                    
                    // Add customization facts
                    if (item.customizations && item.customizations.length > 0) {
                        facts.push({
                            fact: `Prefers customizations: ${item.customizations.join(', ')} for ${item.name || item.itemId}`,
                            created_at: new Date().toISOString(),
                            rating: 0.9
                        });
                    }
                });
            }
            
            // Add order total as fact
            if (orderData.total) {
                facts.push({
                    fact: `Last order total was $${orderData.total}`,
                    created_at: new Date().toISOString(),
                    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Expires in 30 days
                    rating: 0.7
                });
            }
            
            // Add order time preference
            const hour = new Date().getHours();
            const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
            facts.push({
                fact: `Often orders in the ${timeOfDay}`,
                created_at: new Date().toISOString(),
                rating: 0.8
            });
            
            await this.addUserFacts(userId, facts);
            return true;
        } catch (error) {
            console.error('[Zep] Error updating order facts:', error);
            return false;
        }
    }
    
    /**
     * Search user's conversation history
     */
    async searchUserHistory(userId, query, limit = 5) {
        try {
            const results = await this.client.graph.search({
                userId: userId,
                query: query,
                limit: limit,
                scope: 'edges'
            }, {
                apiKey: this.apiKey
            });
            
            console.log(`[Zep] Found ${results?.edges?.length || 0} results for query: "${query}"`);
            return results?.edges || [];
        } catch (error) {
            console.error('[Zep] Error searching user history:', error);
            return [];
        }
    }
    
    /**
     * Get conversation summary
     */
    async getConversationSummary(userId) {
        try {
            const threadId = this.activeThreads.get(userId);
            if (!threadId) {
                return null;
            }
            
            const messages = await this.client.thread.getMessages(threadId, {
                limit: 50
            }, {
                apiKey: this.apiKey
            });
            
            if (!messages || messages.length === 0) {
                return null;
            }
            
            // Create a simple summary from recent messages
            const summary = {
                messageCount: messages.length,
                firstMessage: messages[0]?.content,
                lastMessage: messages[messages.length - 1]?.content,
                duration: this.calculateDuration(messages),
                topics: this.extractTopics(messages)
            };
            
            console.log(`[Zep] Generated summary for thread: ${threadId}`);
            return summary;
        } catch (error) {
            console.error('[Zep] Error getting conversation summary:', error);
            return null;
        }
    }
    
    /**
     * End a conversation thread
     */
    async endThread(userId) {
        try {
            const threadId = this.activeThreads.get(userId);
            if (!threadId) {
                return;
            }
            
            // Update thread metadata to mark as ended
            await this.client.thread.update(threadId, {
                metadata: {
                    endedAt: new Date().toISOString(),
                    status: 'completed'
                }
            }, {
                apiKey: this.apiKey
            });
            
            // Remove from active threads
            this.activeThreads.delete(userId);
            
            // Clear context cache
            this.contextCache.delete(userId);
            
            console.log(`[Zep] Ended thread: ${threadId} for user: ${userId}`);
        } catch (error) {
            console.error('[Zep] Error ending thread:', error);
        }
    }
    
    /**
     * Get user's graph facts
     */
    async getUserFacts(userId, limit = 20) {
        try {
            // Search for all facts in the user's graph
            const results = await this.client.graph.search({
                userId: userId,
                query: '*',
                limit: limit,
                scope: 'nodes'
            }, {
                apiKey: this.apiKey
            });
            
            const facts = results?.nodes || [];
            console.log(`[Zep] Retrieved ${facts.length} facts for user: ${userId}`);
            return facts;
        } catch (error) {
            console.error('[Zep] Error getting user facts:', error);
            return [];
        }
    }
    
    /**
     * Helper: Calculate conversation duration
     */
    calculateDuration(messages) {
        if (!messages || messages.length < 2) return 0;
        
        const first = new Date(messages[0].created_at || messages[0].metadata?.timestamp);
        const last = new Date(messages[messages.length - 1].created_at || messages[messages.length - 1].metadata?.timestamp);
        
        return Math.round((last - first) / 1000); // Duration in seconds
    }
    
    /**
     * Helper: Extract topics from messages
     */
    extractTopics(messages) {
        const topics = new Set();
        const keywords = ['coffee', 'latte', 'espresso', 'cappuccino', 'tea', 'pastry', 'muffin', 'sandwich'];
        
        messages.forEach(msg => {
            const content = msg.content.toLowerCase();
            keywords.forEach(keyword => {
                if (content.includes(keyword)) {
                    topics.add(keyword);
                }
            });
        });
        
        return Array.from(topics);
    }
}

module.exports = ZepMemoryService;