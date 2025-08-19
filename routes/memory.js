const express = require('express');
const router = express.Router();
const ZepMemoryService = require('../services/zep-memory');

// Initialize Zep Memory Service
const zepMemory = new ZepMemoryService(process.env.ZEP_API_KEY);

/**
 * Update memory with conversation context
 * This tool is called throughout the agent workflow to maintain rich context
 */
router.post('/update', async (req, res) => {
    try {
        const { userId, sessionId, type, data } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        let result = { success: false };
        
        switch (type) {
            case 'user_identified':
                // User has been identified, create/retrieve user and start thread
                await zepMemory.ensureUser(userId, {
                    name: data.name,
                    metadata: {
                        sessionId: sessionId,
                        firstSeen: data.firstTime ? new Date().toISOString() : undefined,
                        visitCount: data.visitCount || 1
                    }
                });
                
                // Create conversation thread
                await zepMemory.createThread(userId, sessionId);
                
                // Add initial context facts
                if (data.isReturning) {
                    await zepMemory.addUserFacts(userId, [
                        {
                            fact: `Customer name is ${data.name}`,
                            rating: 1.0
                        },
                        {
                            fact: `Has visited ${data.visitCount} times`,
                            rating: 0.9
                        }
                    ]);
                }
                
                result = { success: true, message: 'User memory initialized' };
                break;
                
            case 'message':
                // Add conversation message to memory
                if (data.content && data.role) {
                    await zepMemory.addMessage(
                        userId, 
                        data.content, 
                        data.role,
                        data.metadata || {}
                    );
                    result = { success: true, message: 'Message added to memory' };
                }
                break;
                
            case 'order_item':
                // Customer is ordering an item
                const itemFacts = [];
                
                if (data.itemName) {
                    itemFacts.push({
                        fact: `Interested in ${data.itemName}`,
                        rating: 0.9
                    });
                }
                
                if (data.customizations && data.customizations.length > 0) {
                    itemFacts.push({
                        fact: `Prefers ${data.customizations.join(', ')}`,
                        rating: 0.8
                    });
                }
                
                if (itemFacts.length > 0) {
                    await zepMemory.addUserFacts(userId, itemFacts);
                }
                
                result = { success: true, message: 'Order preferences updated' };
                break;
                
            case 'order_completed':
                // Order has been completed
                await zepMemory.updateOrderFacts(userId, data);
                
                // Add completion message
                await zepMemory.addMessage(
                    userId,
                    `Order completed: ${data.orderId}. Total: $${data.total}`,
                    'system',
                    { type: 'order_completion' }
                );
                
                result = { success: true, message: 'Order facts recorded' };
                break;
                
            case 'preference':
                // Customer expressed a preference
                if (data.preference) {
                    await zepMemory.addUserFacts(userId, {
                        fact: data.preference,
                        rating: data.rating || 0.8
                    });
                    result = { success: true, message: 'Preference recorded' };
                }
                break;
                
            case 'session_end':
                // Conversation ended
                await zepMemory.endThread(userId);
                result = { success: true, message: 'Session memory finalized' };
                break;
                
            default:
                result = { success: false, error: 'Unknown update type' };
        }
        
        res.json(result);
        
    } catch (error) {
        console.error('Memory update error:', error);
        res.status(500).json({ 
            error: 'Failed to update memory',
            details: error.message 
        });
    }
});

/**
 * Get enriched context for a user
 */
router.get('/context/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const context = await zepMemory.getUserContext(userId);
        
        if (!context) {
            return res.json({ 
                context: null,
                message: 'No context available for user'
            });
        }
        
        // Format context for agent consumption
        const formattedContext = {
            facts: context.facts || [],
            entities: context.entities || [],
            summary: context.context || '',
            raw: context
        };
        
        res.json(formattedContext);
        
    } catch (error) {
        console.error('Context retrieval error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve context',
            details: error.message 
        });
    }
});

/**
 * Search user's conversation history
 */
router.post('/search', async (req, res) => {
    try {
        const { userId, query, limit = 5 } = req.body;
        
        if (!userId || !query) {
            return res.status(400).json({ 
                error: 'User ID and search query are required' 
            });
        }
        
        const results = await zepMemory.searchUserHistory(userId, query, limit);
        
        res.json({
            query: query,
            results: results,
            count: results.length
        });
        
    } catch (error) {
        console.error('Memory search error:', error);
        res.status(500).json({ 
            error: 'Failed to search memory',
            details: error.message 
        });
    }
});

/**
 * Get user's facts from graph
 */
router.get('/facts/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 20 } = req.query;
        
        const facts = await zepMemory.getUserFacts(userId, parseInt(limit));
        
        res.json({
            userId: userId,
            facts: facts,
            count: facts.length
        });
        
    } catch (error) {
        console.error('Facts retrieval error:', error);
        res.status(500).json({ 
            error: 'Failed to retrieve facts',
            details: error.message 
        });
    }
});

/**
 * Get conversation summary
 */
router.get('/summary/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const summary = await zepMemory.getConversationSummary(userId);
        
        if (!summary) {
            return res.json({
                summary: null,
                message: 'No conversation to summarize'
            });
        }
        
        res.json(summary);
        
    } catch (error) {
        console.error('Summary generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate summary',
            details: error.message 
        });
    }
});

module.exports = router;