import React, { useState, useRef, useEffect } from 'react';
import { RealtimeSession } from '@openai/agents/realtime';
import { createBaristaAgent } from './agent/barista';
import { Coffee, Mic, MicOff, Volume2, Loader2 } from 'lucide-react';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [orderHistory, setOrderHistory] = useState<string[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const sessionRef = useRef<RealtimeSession | null>(null);

  const connectToBarista = async () => {
    setIsConnecting(true);
    try {
      const agent = createBaristaAgent();
      const session = new RealtimeSession(agent);
      
      // For demo purposes - using a hardcoded API key
      // In production, fetch ephemeral key from your backend
      await session.connect({
        apiKey: process.env.REACT_APP_OPENAI_API_KEY || 'demo-key',
      });

      sessionRef.current = session;
      setIsConnected(true);
      
      // Add initial greeting to order history
      setOrderHistory(prev => [...prev, "Bella: Hi! Welcome to Brew & Byte Café! What can I brew for you today?"]);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert('Failed to connect to barista. Please check your API key.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (sessionRef.current) {
      sessionRef.current.disconnect();
      sessionRef.current = null;
    }
    setIsConnected(false);
    setOrderHistory(prev => [...prev, "--- Session ended ---"]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // TODO: Implement actual mute functionality with the session
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-100 to-coffee-50">
      {/* Header */}
      <header className="bg-coffee-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coffee className="w-10 h-10 text-coffee-200" />
              <div>
                <h1 className="text-3xl font-bold">Brew & Byte Café</h1>
                <p className="text-coffee-200 text-sm">Your AI-Powered Coffee Experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                isConnected ? 'bg-green-500' : 'bg-gray-500'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-white animate-pulse' : 'bg-gray-300'
                }`} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Chat/Order Window */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 h-96 overflow-y-auto">
            <div className="space-y-4">
              {orderHistory.length === 0 ? (
                <div className="text-center text-gray-500 mt-20">
                  <Coffee className="w-16 h-16 mx-auto mb-4 text-coffee-300" />
                  <p className="text-lg">Connect to start ordering!</p>
                  <p className="text-sm mt-2">Our barista Bella is ready to help you</p>
                </div>
              ) : (
                orderHistory.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.startsWith('Bella:') 
                        ? 'bg-coffee-100 text-coffee-900' 
                        : message.startsWith('You:')
                        ? 'bg-blue-100 text-blue-900 ml-auto max-w-md'
                        : 'text-center text-gray-500 text-sm italic'
                    }`}
                  >
                    {message}
                  </div>
                ))
              )}
              {currentTranscript && (
                <div className="p-3 rounded-lg bg-gray-100 text-gray-600 italic">
                  Speaking: {currentTranscript}
                </div>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-center space-x-6">
              {!isConnected ? (
                <button
                  onClick={connectToBarista}
                  disabled={isConnecting}
                  className="flex items-center space-x-3 bg-coffee-600 hover:bg-coffee-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-full font-semibold transition-all transform hover:scale-105 disabled:scale-100"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <Coffee className="w-6 h-6" />
                      <span>Connect to Barista</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMute}
                    className={`p-4 rounded-full transition-all transform hover:scale-110 ${
                      isMuted 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
                  </button>
                  
                  <div className="flex flex-col items-center">
                    <Volume2 className="w-12 h-12 text-coffee-600 animate-pulse" />
                    <span className="text-sm text-gray-600 mt-2">Listening...</span>
                  </div>

                  <button
                    onClick={disconnect}
                    className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-full font-semibold transition-all"
                  >
                    <span>End Session</span>
                  </button>
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-6 text-center text-sm text-gray-600">
              {!isConnected ? (
                <p>Click "Connect to Barista" to start your voice order</p>
              ) : (
                <p>Speak naturally to place your order. Bella is listening!</p>
              )}
            </div>
          </div>

          {/* Menu Preview */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-coffee-800 mb-2">☕ Signature Drinks</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Binary Brew (Cortado)</li>
                <li>• Algorithmic Arabica</li>
                <li>• Debug Latte</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-coffee-800 mb-2">🥐 Fresh Pastries</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Croissants</li>
                <li>• Blueberry Muffins</li>
                <li>• Chocolate Scones</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-coffee-800 mb-2">🥛 Milk Options</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Oat Milk</li>
                <li>• Almond Milk</li>
                <li>• Soy & Coconut</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;