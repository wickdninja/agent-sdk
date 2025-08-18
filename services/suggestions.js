const db = require('../database');
const sessionManager = require('./session-manager');

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
    
    const context = {
      lastItem: currentItem,
      ...conversationContext,
      ...sessionContext
    };
    
    const suggestions = await db.getSuggestions(userId, context);
    
    return suggestions;
  } catch (error) {
    console.error('Error generating suggestions:', error);
    throw error;
  }
}

module.exports = {
  generateSuggestions
};