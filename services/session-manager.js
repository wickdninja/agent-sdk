/**
 * Session Manager Service
 * Manages user session context using database persistence
 * Provides consistent session management across the application
 */

const db = require('../database');
const crypto = require('crypto');

class SessionManager {
  constructor() {
    // Start periodic cleanup of old sessions
    this.startCleanupInterval();
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return 'session_' + crypto.randomBytes(16).toString('hex');
  }

  /**
   * Get or create a session for a user
   */
  async getOrCreateSession(sessionId, userId = null) {
    try {
      let session = await db.getSession(sessionId);
      
      if (!session) {
        session = await db.createSession(sessionId, userId);
      }
      
      return session;
    } catch (error) {
      console.error('Error getting/creating session:', error);
      throw error;
    }
  }

  /**
   * Update session context data
   */
  async updateSessionContext(sessionId, contextData) {
    try {
      const session = await db.getSession(sessionId);
      if (!session) {
        await db.createSession(sessionId);
      }
      
      const currentContext = session ? session.context : {};
      const updatedContext = {
        ...currentContext,
        ...contextData,
        lastUpdated: new Date().toISOString()
      };
      
      return await db.updateSession(sessionId, { context: updatedContext });
    } catch (error) {
      console.error('Error updating session context:', error);
      throw error;
    }
  }

  /**
   * Set user info for a session
   */
  async setUserInfo(sessionId, userId, userInfo) {
    try {
      return await db.updateSession(sessionId, {
        userId,
        userInfo: {
          ...userInfo,
          lastUpdated: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error setting user info:', error);
      throw error;
    }
  }

  /**
   * Get session by user ID (finds most recent session)
   */
  async getSessionByUserId(userId) {
    try {
      return await db.getSessionByUserId(userId);
    } catch (error) {
      console.error('Error getting session by user ID:', error);
      throw error;
    }
  }

  /**
   * Get session context for suggestions
   */
  async getSessionContext(sessionId) {
    try {
      const session = await db.getSession(sessionId);
      
      if (!session) {
        return {};
      }
      
      const now = new Date();
      const createdAt = new Date(session.created_at);
      const sessionDuration = now - createdAt;
      
      return {
        ...session.context,
        userInfo: session.user_info,
        sessionDuration,
        sessionAge: Math.floor(sessionDuration / 60000) // in minutes
      };
    } catch (error) {
      console.error('Error getting session context:', error);
      return {};
    }
  }

  /**
   * Clear a session
   */
  async clearSession(sessionId) {
    try {
      return await db.deleteSession(sessionId);
    } catch (error) {
      console.error('Error clearing session:', error);
      throw error;
    }
  }

  /**
   * Get all active sessions (for monitoring)
   */
  async getActiveSessions(minutes = 15) {
    try {
      return await db.getActiveSessions(minutes);
    } catch (error) {
      console.error('Error getting active sessions:', error);
      return [];
    }
  }

  /**
   * Clean up inactive sessions
   */
  async cleanupInactiveSessions() {
    try {
      const deletedCount = await db.cleanupOldSessions(30); // 30 minutes
      if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} inactive sessions`);
      }
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up sessions:', error);
      return 0;
    }
  }

  /**
   * Start periodic cleanup of inactive sessions
   */
  startCleanupInterval() {
    // Run cleanup every 15 minutes
    setInterval(async () => {
      await this.cleanupInactiveSessions();
    }, 15 * 60 * 1000);
    
    // Also run cleanup on startup
    setTimeout(() => this.cleanupInactiveSessions(), 5000);
  }
}

// Export a singleton instance
module.exports = new SessionManager();