const db = require('../database');
const sessionManager = require('./session-manager');
const ZepMemoryService = require('./zep-memory');

// Initialize Zep Memory if available
let zepMemory = null;
if (process.env.ZEP_API_KEY) {
  zepMemory = new ZepMemoryService(process.env.ZEP_API_KEY);
}

async function generateSuggestions(userId, sessionId, currentItem, conversationContext) {
  try {
    // Get session context if sessionId is provided
    let sessionContext = {};
    if (sessionId) {
      sessionContext = await sessionManager.getSessionContext(sessionId);
      
      // Update session with latest context
      await sessionManager.updateSessionContext(sessionId, {
        lastSuggestion: new Date().toISOString(),
        lastItem: currentItem
      });
    }
    
    // Get enriched context from Zep memory if available
    let memoryContext = {};
    if (zepMemory && userId) {
      const userContext = await zepMemory.getUserContext(userId);
      if (userContext) {
        // Extract relevant facts for suggestions
        memoryContext = {
          userFacts: userContext.facts || [],
          userPreferences: userContext.entities?.filter(e => e.type === 'preference') || [],
          contextSummary: userContext.context || ''
        };
        
        // Search for relevant past orders if user is asking about favorites
        if (conversationContext?.lookingForFavorites) {
          const favoriteResults = await zepMemory.searchUserHistory(userId, 'favorite usual order', 5);
          memoryContext.favorites = favoriteResults;
        }
      }
    }
    
    const context = {
      lastItem: currentItem,
      ...conversationContext,
      ...sessionContext,
      ...memoryContext
    };
    
    const suggestions = await db.getSuggestions(userId, context);
    
    // Enhance suggestions with memory-based insights
    if (memoryContext.userFacts && memoryContext.userFacts.length > 0) {
      // Add personalized suggestions based on facts
      const personalizedSuggestions = [];
      
      // Check for morning/afternoon/evening preferences
      const timePreferences = memoryContext.userFacts.filter(f => 
        f.fact.includes('morning') || f.fact.includes('afternoon') || f.fact.includes('evening')
      );
      
      if (timePreferences.length > 0) {
        const hour = new Date().getHours();
        const currentTime = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
        const relevantPref = timePreferences.find(p => p.fact.includes(currentTime));
        
        if (relevantPref) {
          personalizedSuggestions.push({
            type: 'personalized',
            title: 'Based on your preferences',
            items: suggestions.favorites?.items || []
          });
        }
      }
      
      // Merge personalized suggestions with regular ones
      if (personalizedSuggestions.length > 0) {
        return [...personalizedSuggestions, ...suggestions];
      }
    }
    
    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
}

module.exports = {
  generateSuggestions
};