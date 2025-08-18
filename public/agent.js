// Brew & Byte Café - WebRTC Realtime Voice with Audio Visualization

class RealtimeVoiceAgent {
    constructor() {
        this.pc = null;
        this.dc = null;
        this.isConnected = false;
        this.currentUserId = null;
        this.currentOrder = { items: [] };
        this.audioContext = null;
        this.micAnalyser = null;
        this.agentAnalyser = null;
        this.micStream = null;
        this.lastMessageTime = null;
        this.currentContext = {};
        this.suggestionUpdateInterval = null;
        this.lastInteractionTime = Date.now();
        this.sessionId = null;
        
        // DOM elements
        this.chatWindow = document.getElementById('chat-window');
        this.chatMessages = document.getElementById('chat-messages');
        this.statusIndicator = document.getElementById('status-indicator');
        this.statusDot = document.getElementById('status-dot');
        this.statusText = document.getElementById('status-text');
        this.instructions = document.getElementById('instructions');
        this.orderStatus = document.getElementById('order-status');
        this.micVisualizerCanvas = document.getElementById('mic-visualizer');
        this.agentVisualizerCanvas = document.getElementById('agent-visualizer');
        this.suggestionsPanel = document.getElementById('suggestions-panel');
        this.suggestionsContainer = document.getElementById('suggestions-container');
        this.muteButton = document.getElementById('mute-button');
        this.muteText = document.getElementById('mute-text');
        this.muteIcon = document.getElementById('mute-icon');
        this.unmuteIcon = document.getElementById('unmute-icon');
        this.startOverButton = document.getElementById('start-over-button');
        this.quickStartButton = document.getElementById('quick-start-button');
        this.controlPanel = document.getElementById('control-panel');
        this.audioVisualizers = document.getElementById('audio-visualizers');
        this.initialPrompt = document.getElementById('initial-prompt');
        this.isMuted = false;
        this.sessionActive = false;
        
        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Tools definition
        this.tools = [
            {
                type: "function",
                name: "fetch_menu",
                description: "Fetch the current menu with all items and prices",
                parameters: {
                    type: "object",
                    properties: {},
                    required: []
                }
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
                    required: ["name"]
                }
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
                                required: ["itemId"]
                            }
                        }
                    },
                    required: ["items"]
                }
            },
            {
                type: "function",
                name: "submit_order",
                description: "Submit the final order for processing",
                parameters: {
                    type: "object",
                    properties: {},
                    required: []
                }
            },
            {
                type: "function",
                name: "get_order_history",
                description: "Get the customer's order history to see what they've ordered before",
                parameters: {
                    type: "object",
                    properties: {},
                    required: []
                }
            }
        ];
        
        this.initializeEventListeners();
        this.setupVisualizers();
    }
    
    initializeEventListeners() {
        // Quick start button
        if (this.quickStartButton) {
            this.quickStartButton.addEventListener('click', () => this.connect());
        }
        
        // Start over button - disconnect and reset to initial state
        if (this.startOverButton) {
            this.startOverButton.addEventListener('click', () => {
                this.disconnect();
            });
        }
        
        // Mute/Unmute button
        if (this.muteButton) {
            this.muteButton.addEventListener('click', () => this.toggleMute());
        }
    }
    
    setupVisualizers() {
        if (!this.micVisualizerCanvas || !this.agentVisualizerCanvas) {
            console.warn('[Visualizers] Canvas elements not found');
            return;
        }
        
        // Setup microphone visualizer
        this.micCtx = this.micVisualizerCanvas.getContext('2d');
        this.agentCtx = this.agentVisualizerCanvas.getContext('2d');
        
        // Wait for next frame to ensure proper dimensions after display
        requestAnimationFrame(() => {
            // Set canvas dimensions with fallback
            this.micVisualizerCanvas.width = this.micVisualizerCanvas.offsetWidth || 400;
            this.micVisualizerCanvas.height = this.micVisualizerCanvas.offsetHeight || 80;
            this.agentVisualizerCanvas.width = this.agentVisualizerCanvas.offsetWidth || 400;
            this.agentVisualizerCanvas.height = this.agentVisualizerCanvas.offsetHeight || 80;
            
            console.log('[Visualizers] Setup complete - Mic:', 
                this.micVisualizerCanvas.width, 'x', this.micVisualizerCanvas.height,
                'Agent:', this.agentVisualizerCanvas.width, 'x', this.agentVisualizerCanvas.height);
        });
    }
    
    async connect() {
        console.log('[Connect] Starting connection process...');
        try {
            this.updateConnectionStatus('connecting');
            
            // Resume audio context if suspended (required for browser autoplay policies)
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('[Audio] AudioContext resumed');
            }
            
            // Get ephemeral token from server
            console.log('[Connect] Fetching ephemeral token...');
            const tokenResponse = await fetch('/api/session');
            const data = await tokenResponse.json();
            console.log('[Connect] Token received:', data.client_secret ? 'Success' : 'Failed');
            
            // Store session ID if provided
            if (data.sessionId) {
                this.sessionId = data.sessionId;
                console.log('[Connect] Session ID:', this.sessionId);
            }
            
            if (!data.client_secret) {
                throw new Error('Failed to get ephemeral token');
            }
            
            const ephemeralKey = data.client_secret.value;
            const EPHEMERAL_KEY = ephemeralKey;
            
            // Create peer connection
            this.pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' }
                ]
            });
            
            // Setup audio element for agent output
            const audioEl = document.createElement('audio');
            audioEl.autoplay = true;
            this.pc.ontrack = e => {
                audioEl.srcObject = e.streams[0];
                this.setupAgentAudioAnalyser(e.streams[0]);
            };
            
            // Add microphone input
            this.micStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 24000  // Match OpenAI's expected sample rate
                } 
            });
            
            // Store audio track reference and add to peer connection
            this.audioTrack = this.micStream.getAudioTracks()[0];
            this.micStream.getTracks().forEach(track => {
                this.pc.addTrack(track, this.micStream);
            });
            
            // Start with microphone enabled for continuous conversation
            if (this.audioTrack) {
                this.audioTrack.enabled = true;
                this.sessionActive = true;
            }
            
            // Setup microphone analyser
            this.setupMicrophoneAnalyser(this.micStream);
            
            // Setup data channel for events
            this.dc = this.pc.createDataChannel('oai-events', {
                ordered: true
            });
            
            this.dc.onopen = () => {
                console.log('[DataChannel] Opened successfully');
                this.sendSessionUpdate();
            };
            
            this.dc.onmessage = (e) => {
                const event = JSON.parse(e.data);
                console.log('[DataChannel] Message received:', event.type);
                this.handleRealtimeEvent(event);
            };
            
            this.dc.onerror = (error) => {
                console.error('Data channel error:', error);
            };
            
            // Create and send offer
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);
            
            // Send offer to OpenAI
            const sdpResponse = await fetch('https://api.openai.com/v1/realtime', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${EPHEMERAL_KEY}`,
                    'Content-Type': 'application/sdp'
                },
                body: offer.sdp
            });
            
            if (!sdpResponse.ok) {
                throw new Error('Failed to connect to OpenAI Realtime API');
            }
            
            const answer = {
                type: 'answer',
                sdp: await sdpResponse.text()
            };
            
            await this.pc.setRemoteDescription(answer);
            
            // Wait for connection to establish
            this.pc.onconnectionstatechange = () => {
                console.log('[WebRTC] Connection state changed:', this.pc.connectionState);
                if (this.pc.connectionState === 'connected') {
                    this.updateConnectionStatus('connected');
                    this.onSessionStarted();
                    
                    // Start visualizers
                    this.animateMicVisualizer();
                    this.animateAgentVisualizer();
                } else if (this.pc.connectionState === 'failed' || this.pc.connectionState === 'disconnected') {
                    this.updateConnectionStatus('disconnected');
                }
            };
            
        } catch (error) {
            console.error('Connection error:', error);
            this.updateConnectionStatus('disconnected');
            this.addMessage("System", `Connection failed: ${error.message}`, true);
        }
    }
    
    sendSessionUpdate() {
        const sessionUpdate = {
            type: 'session.update',
            session: {
                instructions: `You are Bella, a friendly and knowledgeable barista at Brew & Byte Café.

IMPORTANT WORKFLOW:
1. ALWAYS start by warmly greeting the customer and asking for their name
2. Use the set_user function to create or find their account
3. If they're a returning customer:
   - Acknowledge them warmly by name
   - Mention how many times they've been here
   - You can optionally ask if they want their "usual" if they have ordered before
   - Use get_order_history if they want to know what they ordered previously
4. Use fetch_menu function when discussing menu items or prices
5. Take their order, asking about customizations (milk type, syrups, etc.)
6. Use confirm_order function to calculate the total
7. Tell them the total price and ask for confirmation
8. Use submit_order function once they confirm
9. Provide the order number and estimated time

Your personality:
- Warm, welcoming, and enthusiastic about coffee
- Remember returning customers and make them feel valued
- Patient with customers who are new to specialty coffee
- Passionate about sharing your coffee knowledge
- A bit quirky and fun, occasionally making coffee puns
- Professional but personable

Order Management:
- Keep track of items as the customer orders them
- Always clarify size, temperature, and customizations
- For returning customers, you can suggest their favorites
- Suggest complementary items (e.g., pastry with coffee)
- Be clear about pricing, especially for add-ons

When using functions:
- Don't mention that you're "using a function" or "checking the system"
- Integrate the information naturally into conversation
- If a function fails, handle it gracefully without technical details

Remember: Keep the conversation natural and friendly. You're having a real conversation, not reading from a script.`,
                voice: 'alloy',
                turn_detection: {
                    type: 'server_vad',
                    threshold: 0.5,
                    prefix_padding_ms: 300,
                    silence_duration_ms: 500
                },
                tools: this.tools,
                tool_choice: 'auto',
                temperature: 0.8,
                max_response_output_tokens: 4096
            }
        };
        
        this.sendDataChannelMessage(sessionUpdate);
    }
    
    sendDataChannelMessage(message) {
        if (this.dc && this.dc.readyState === 'open') {
            console.log('[DataChannel] Sending message:', message.type);
            this.dc.send(JSON.stringify(message));
        } else {
            console.warn('[DataChannel] Not ready, message not sent:', message.type);
        }
    }
    
    handleRealtimeEvent(event) {
        // Log all events for debugging
        console.log(`[Event] ${event.type}:`, event);
        
        // Update last interaction time on any conversation event
        if (event.type.startsWith('conversation') || event.type.startsWith('response')) {
            this.lastInteractionTime = Date.now();
        }
        
        switch (event.type) {
            case 'session.created':
                console.log('Session created');
                // Trigger initial response
                this.sendDataChannelMessage({
                    type: 'response.create',
                    response: {
                        modalities: ['text', 'audio']
                    }
                });
                break;
                
            case 'session.updated':
                console.log('Session updated');
                break;
                
            case 'conversation.item.created':
                console.log('Conversation item created:', event);
                if (event.item.role === 'user') {
                    // Handle user input - could be audio or message
                    if (event.item.type === 'message' && event.item.content && event.item.content[0]) {
                        const inputText = event.item.content[0].text;
                        // Only add if it's from input_text (programmatic input), not from audio
                        if (inputText && event.item.content[0].type === 'input_text') {
                            // Check if message isn't already displayed
                            const lastMessage = this.chatMessages.lastElementChild;
                            const lastMessageText = lastMessage?.textContent || '';
                            if (!lastMessageText.includes(inputText)) {
                                this.addMessage('You', inputText);
                            }
                        }
                    } else if (event.item.type === 'input_audio') {
                        // Audio input will be transcribed later
                        console.log('User audio input detected');
                    }
                } else if (event.item.role === 'assistant' && event.item.type === 'message') {
                    if (event.item.content && event.item.content[0]) {
                        const transcript = event.item.content[0].transcript || event.item.content[0].text || '';
                        if (transcript) {
                            this.addMessage('Bella', transcript);
                        }
                    }
                }
                break;
                
            case 'response.audio_transcript.delta':
                // Update current transcript
                this.updateCurrentTranscript(event.delta);
                break;
                
            case 'response.audio_transcript.done':
                // Finalize transcript
                this.finalizeTranscript(event.transcript);
                break;
                
            case 'conversation.item.input_audio_transcription.completed':
                console.log('User audio transcription completed:', event);
                // Only add message if it's not already displayed
                if (event.transcript && event.transcript.trim()) {
                    // Check if we just added this message from text input
                    const lastMessage = this.chatMessages.lastElementChild;
                    const lastMessageText = lastMessage?.textContent || '';
                    if (!lastMessageText.includes(event.transcript)) {
                        this.addMessage('You', event.transcript);
                    }
                } else {
                    this.addMessage('You', '🎤 [Audio message]');
                }
                break;
                
            case 'input_audio_buffer.speech_started':
                console.log('[Speech] User started speaking');
                // Show speaking indicator
                this.showUserSpeakingIndicator();
                break;
                
            case 'input_audio_buffer.speech_stopped':
                console.log('[Speech] User stopped speaking');
                // Hide speaking indicator after a delay
                setTimeout(() => this.hideUserSpeakingIndicator(), 500);
                break;
                
            case 'response.function_call_arguments.done':
                // Handle function calls
                this.handleFunctionCall(event.name, JSON.parse(event.arguments), event.call_id);
                break;
                
            case 'error':
                console.error('Realtime error:', event.error);
                this.addMessage('System', `Error: ${event.error.message}`, true);
                break;
                
            default:
                console.log(`[Unhandled Event] ${event.type}:`, event);
                break;
        }
    }
    
    async handleFunctionCall(functionName, args, callId) {
        console.log(`[Function] Executing: ${functionName}`, args);
        let result;
        
        try {
            switch (functionName) {
                case 'fetch_menu':
                    const menuResponse = await fetch('/api/tools/menu');
                    result = await menuResponse.json();
                    break;
                
                case 'set_user':
                    const userResponse = await fetch('/api/tools/user', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            name: args.name,
                            sessionId: this.sessionId 
                        })
                    });
                    const userData = await userResponse.json();
                    this.currentUserId = userData.userId;
                    result = userData;
                    // Show suggestions panel once user is identified
                    if (this.suggestionsPanel) {
                        this.suggestionsPanel.style.display = 'block';
                        this.updateSuggestions();
                        this.startSuggestionUpdates();
                    }
                    break;
                
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
                    // Store context for suggestions
                    if (args.items && args.items.length > 0) {
                        this.currentContext.lastItem = args.items[args.items.length - 1];
                    }
                    result = confirmData;
                    this.updateSuggestions();
                    break;
                
                case 'submit_order':
                    if (!this.currentUserId || !this.currentOrder.items.length) {
                        result = { error: 'No order to submit' };
                    } else {
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
                        
                        result = orderData;
                        
                        // Don't auto-disconnect - let user control when to end session
                        // This prevents cutting off the agent's final audio message
                    }
                    break;
                    
                case 'get_order_history':
                    if (!this.currentUserId) {
                        result = { error: 'No user identified yet' };
                    } else {
                        const historyResponse = await fetch(`/api/tools/history?userId=${this.currentUserId}`);
                        const historyData = await historyResponse.json();
                        result = historyData;
                    }
                    break;
                
                default:
                    result = { error: `Unknown function: ${functionName}` };
            }
        } catch (error) {
            console.error(`[Function] Error executing ${functionName}:`, error);
            result = { error: `Failed to execute ${functionName}` };
        }
        
        console.log(`[Function] Result for ${functionName}:`, result);
        
        // Send function output back
        this.sendDataChannelMessage({
            type: 'conversation.item.create',
            item: {
                type: 'function_call_output',
                call_id: callId,
                output: JSON.stringify(result)
            }
        });
        
        // Continue the response
        this.sendDataChannelMessage({
            type: 'response.create'
        });
    }
    
    setupMicrophoneAnalyser(stream) {
        console.log('[Audio] Setting up microphone analyser');
        const source = this.audioContext.createMediaStreamSource(stream);
        this.micAnalyser = this.audioContext.createAnalyser();
        this.micAnalyser.fftSize = 256;
        source.connect(this.micAnalyser);
        console.log('[Audio] Microphone analyser ready');
    }
    
    setupAgentAudioAnalyser(stream) {
        console.log('[Audio] Setting up agent audio analyser');
        const source = this.audioContext.createMediaStreamSource(stream);
        this.agentAnalyser = this.audioContext.createAnalyser();
        this.agentAnalyser.fftSize = 256;
        source.connect(this.agentAnalyser);
        console.log('[Audio] Agent audio analyser ready');
    }
    
    animateMicVisualizer() {
        const draw = () => {
            if (!this.isConnected || !this.micCtx) return;
            requestAnimationFrame(draw);
            
            // Ensure canvas has proper dimensions
            if (this.micVisualizerCanvas.width === 0) {
                this.micVisualizerCanvas.width = this.micVisualizerCanvas.offsetWidth || 400;
                this.micVisualizerCanvas.height = this.micVisualizerCanvas.offsetHeight || 80;
            }
            
            if (!this.micAnalyser) {
                // Draw idle state if no analyser
                this.micCtx.fillStyle = 'rgb(240, 240, 240)';
                this.micCtx.fillRect(0, 0, this.micVisualizerCanvas.width, this.micVisualizerCanvas.height);
                
                // Draw idle bars
                const barCount = 30;
                const barWidth = this.micVisualizerCanvas.width / barCount - 1;
                for (let i = 0; i < barCount; i++) {
                    const x = i * (barWidth + 1);
                    const barHeight = 5 + Math.sin(Date.now() * 0.002 + i * 0.5) * 3;
                    
                    this.micCtx.fillStyle = '#93c5fd';
                    this.micCtx.fillRect(x, this.micVisualizerCanvas.height - barHeight, barWidth, barHeight);
                }
                return;
            }
            
            const bufferLength = this.micAnalyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.micAnalyser.getByteFrequencyData(dataArray);
            
            this.micCtx.fillStyle = 'rgb(240, 240, 240)';
            this.micCtx.fillRect(0, 0, this.micVisualizerCanvas.width, this.micVisualizerCanvas.height);
            
            const barWidth = (this.micVisualizerCanvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * this.micVisualizerCanvas.height;
                
                // Blue gradient for microphone
                const gradient = this.micCtx.createLinearGradient(0, this.micVisualizerCanvas.height, 0, 0);
                gradient.addColorStop(0, '#3B82F6');
                gradient.addColorStop(1, '#60A5FA');
                
                this.micCtx.fillStyle = gradient;
                this.micCtx.fillRect(x, this.micVisualizerCanvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }
    
    animateAgentVisualizer() {
        const draw = () => {
            if (!this.isConnected || !this.agentCtx) return;
            requestAnimationFrame(draw);
            
            // Ensure canvas has proper dimensions
            if (this.agentVisualizerCanvas.width === 0) {
                this.agentVisualizerCanvas.width = this.agentVisualizerCanvas.offsetWidth || 400;
                this.agentVisualizerCanvas.height = this.agentVisualizerCanvas.offsetHeight || 80;
            }
            
            if (!this.agentAnalyser) {
                // Draw idle state if no analyser
                this.agentCtx.fillStyle = 'rgb(240, 240, 240)';
                this.agentCtx.fillRect(0, 0, this.agentVisualizerCanvas.width, this.agentVisualizerCanvas.height);
                
                // Draw idle bars
                const barCount = 30;
                const barWidth = this.agentVisualizerCanvas.width / barCount - 1;
                for (let i = 0; i < barCount; i++) {
                    const x = i * (barWidth + 1);
                    const barHeight = 5 + Math.sin(Date.now() * 0.002 + i * 0.5 + Math.PI) * 3;
                    
                    this.agentCtx.fillStyle = '#fbbf24';
                    this.agentCtx.fillRect(x, this.agentVisualizerCanvas.height - barHeight, barWidth, barHeight);
                }
                return;
            }
            
            const bufferLength = this.agentAnalyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            this.agentAnalyser.getByteFrequencyData(dataArray);
            
            this.agentCtx.fillStyle = 'rgb(240, 240, 240)';
            this.agentCtx.fillRect(0, 0, this.agentVisualizerCanvas.width, this.agentVisualizerCanvas.height);
            
            const barWidth = (this.agentVisualizerCanvas.width / bufferLength) * 2.5;
            let barHeight;
            let x = 0;
            
            for (let i = 0; i < bufferLength; i++) {
                barHeight = (dataArray[i] / 255) * this.agentVisualizerCanvas.height;
                
                // Coffee gradient for agent
                const gradient = this.agentCtx.createLinearGradient(0, this.agentVisualizerCanvas.height, 0, 0);
                gradient.addColorStop(0, '#92400e');
                gradient.addColorStop(1, '#d97706');
                
                this.agentCtx.fillStyle = gradient;
                this.agentCtx.fillRect(x, this.agentVisualizerCanvas.height - barHeight, barWidth, barHeight);
                
                x += barWidth + 1;
            }
        };
        
        draw();
    }
    
    disconnect() {
        console.log('[Disconnect] Ending session...');
        this.isConnected = false;
        this.sessionActive = false;
        
        // Stop suggestion updates
        this.stopSuggestionUpdates();
        
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        if (this.dc) {
            this.dc.close();
            this.dc = null;
        }
        
        if (this.micStream) {
            this.micStream.getTracks().forEach(track => track.stop());
            this.micStream = null;
            this.audioTrack = null;
        }
        
        // Reset UI
        this.updateConnectionStatus('disconnected');
        if (this.controlPanel) {
            this.controlPanel.style.display = 'none';
        }
        if (this.audioVisualizers) {
            this.audioVisualizers.style.display = 'none';
        }
        if (this.suggestionsPanel) {
            this.suggestionsPanel.style.display = 'none';
        }
        
        // Reset UI to initial state
        this.updateConnectionStatus('disconnected');
        
        // Clear all chat messages (except initial prompt)
        this.clearChat();
        
        // Show initial prompt
        if (this.initialPrompt) {
            this.initialPrompt.style.display = 'block';
            // Reset button text
            const quickStartBtn = document.getElementById('quick-start-button');
            if (quickStartBtn) {
                quickStartBtn.textContent = 'Start Order';
            }
        }
        
        // Clear visualizers
        if (this.micCtx) {
            this.micCtx.fillStyle = 'rgb(240, 240, 240)';
            this.micCtx.fillRect(0, 0, this.micVisualizerCanvas.width, this.micVisualizerCanvas.height);
        }
        if (this.agentCtx) {
            this.agentCtx.fillStyle = 'rgb(240, 240, 240)';
            this.agentCtx.fillRect(0, 0, this.agentVisualizerCanvas.width, this.agentVisualizerCanvas.height);
        }
        
        // Hide suggestions panel
        if (this.suggestionsPanel) {
            this.suggestionsPanel.style.display = 'none';
        }
        
        // Reset state
        this.currentUserId = null;
        this.currentOrder = { items: [] };
    }
    
    updateConnectionStatus(status) {
        if (status === 'connected') {
            this.isConnected = true;
            this.statusIndicator.classList.remove('bg-gray-500', 'bg-yellow-500');
            this.statusIndicator.classList.add('bg-green-500');
            this.statusDot.classList.remove('bg-gray-300', 'bg-yellow-300');
            this.statusDot.classList.add('bg-white', 'pulse-animation');
            this.statusText.textContent = 'Connected';
            if (this.instructions) {
                this.instructions.textContent = 'Hold the button and speak your order';
            }
        } else if (status === 'connecting') {
            this.statusIndicator.classList.remove('bg-gray-500', 'bg-green-500');
            this.statusIndicator.classList.add('bg-yellow-500');
            this.statusDot.classList.remove('bg-gray-300', 'bg-white');
            this.statusDot.classList.add('bg-yellow-300', 'pulse-animation');
            this.statusText.textContent = 'Connecting...';
            if (this.instructions) {
                this.instructions.textContent = 'Setting up voice connection...';
            }
        } else {
            this.isConnected = false;
            this.statusIndicator.classList.remove('bg-green-500', 'bg-yellow-500');
            this.statusIndicator.classList.add('bg-gray-500');
            this.statusDot.classList.remove('bg-white', 'bg-yellow-300', 'pulse-animation');
            this.statusDot.classList.add('bg-gray-300');
            this.statusText.textContent = 'Disconnected';
        }
    }
    
    clearChat() {
        // Remove all messages except the initial prompt
        const messages = this.chatMessages.querySelectorAll('.chat-message');
        messages.forEach(msg => msg.remove());
        
        // Also remove any transcript divs or other dynamic content
        const children = Array.from(this.chatMessages.children);
        children.forEach(child => {
            if (child.id !== 'initial-prompt') {
                child.remove();
            }
        });
    }
    
    currentTranscript = '';
    currentTranscriptDiv = null;
    
    updateCurrentTranscript(delta) {
        if (!this.currentTranscriptDiv) {
            this.currentTranscriptDiv = document.createElement('div');
            this.currentTranscriptDiv.className = 'chat-message';
            const messageContent = document.createElement('div');
            messageContent.className = 'p-3 rounded-lg bg-coffee-100 text-coffee-900';
            messageContent.innerHTML = `<strong>Bella:</strong> <span class="transcript-text"></span>`;
            this.currentTranscriptDiv.appendChild(messageContent);
            this.chatMessages.appendChild(this.currentTranscriptDiv);
        }
        
        this.currentTranscript += delta;
        const textSpan = this.currentTranscriptDiv.querySelector('.transcript-text');
        textSpan.textContent = this.currentTranscript;
        
        // Scroll to bottom
        this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
    }
    
    finalizeTranscript(transcript) {
        if (this.currentTranscriptDiv) {
            const textSpan = this.currentTranscriptDiv.querySelector('.transcript-text');
            textSpan.textContent = transcript;
        }
        this.currentTranscript = '';
        this.currentTranscriptDiv = null;
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
        
        // Update suggestions after each message
        if (!isSystem && this.currentUserId) {
            this.updateSuggestions();
        }
    }
    
    showOrderStatus(orderData) {
        const orderStatus = document.getElementById('order-status');
        const orderOverlay = document.getElementById('order-overlay');
        const orderId = document.getElementById('order-id');
        const orderStatusText = document.getElementById('order-status-text');
        const orderTime = document.getElementById('order-time');
        const orderOkButton = document.getElementById('order-ok-button');
        
        orderId.textContent = orderData.orderId;
        orderStatusText.textContent = orderData.status;
        orderTime.textContent = orderData.estimatedTime;
        
        // Show modal and overlay
        orderStatus.classList.remove('hidden');
        orderOverlay.classList.remove('hidden');
        
        // Handle OK button click - just close modal, don't disconnect
        const handleClose = () => {
            orderStatus.classList.add('hidden');
            orderOverlay.classList.add('hidden');
            orderOkButton.removeEventListener('click', handleClose);
            orderOverlay.removeEventListener('click', handleClose);
            
            // Show a message that they can start a new order or end session
            this.addMessage('System', 'Order complete! You can start a new order or end the session.', true);
        };
        
        orderOkButton.addEventListener('click', handleClose);
        orderOverlay.addEventListener('click', handleClose);
        
        // Don't auto-hide - let user dismiss when ready
        // This ensures they can see the order number and details
    }
    
    userSpeakingDiv = null;
    
    showUserSpeakingIndicator() {
        if (!this.userSpeakingDiv) {
            this.userSpeakingDiv = document.createElement('div');
            this.userSpeakingDiv.className = 'chat-message';
            const messageContent = document.createElement('div');
            messageContent.className = 'p-3 rounded-lg bg-blue-100 text-blue-900 ml-auto max-w-md';
            messageContent.innerHTML = '<strong>You:</strong> <span class="speaking-indicator">🎤 Speaking...</span>';
            this.userSpeakingDiv.appendChild(messageContent);
            this.chatMessages.appendChild(this.userSpeakingDiv);
            
            // Scroll to bottom
            this.chatWindow.scrollTop = this.chatWindow.scrollHeight;
        }
    }
    
    hideUserSpeakingIndicator() {
        if (this.userSpeakingDiv) {
            this.userSpeakingDiv.remove();
            this.userSpeakingDiv = null;
        }
    }
    
    async updateSuggestions() {
        if (!this.currentUserId || !this.suggestionsContainer) return;
        
        try {
            const response = await fetch('/api/tools/suggestions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: this.currentUserId,
                    sessionId: this.sessionId,
                    currentItem: this.currentContext.lastItem,
                    conversationContext: this.currentContext
                })
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            this.renderSuggestions(data.suggestions);
        } catch (error) {
            console.error('Failed to fetch suggestions:', error);
        }
    }
    
    renderSuggestions(suggestions) {
        if (!this.suggestionsContainer) return;
        
        this.suggestionsContainer.innerHTML = '';
        
        // Create suggestion cards for right panel
        suggestions.forEach((group, index) => {
            const card = document.createElement('div');
            card.className = 'suggestion-card bg-coffee-50 rounded-lg p-3 mb-3';
            card.style.animationDelay = `${index * 0.05}s`;
            
            // Add icon based on type
            const icon = this.getSuggestionIcon(group.type);
            
            const titleDiv = document.createElement('div');
            titleDiv.className = 'font-semibold text-sm text-coffee-700 mb-2 flex items-center';
            titleDiv.innerHTML = `<span class="mr-1 text-base">${icon}</span> ${group.title}`;
            card.appendChild(titleDiv);
            
            // Show all items for right panel
            group.items.forEach(item => {
                const itemBtn = document.createElement('button');
                itemBtn.className = 'block w-full text-left text-xs text-gray-600 hover:text-coffee-600 hover:bg-white rounded px-2 py-1 transition-colors mb-1';
                itemBtn.innerHTML = item.text;
                itemBtn.onclick = () => this.handleSuggestionClick(item);
                card.appendChild(itemBtn);
            });
            
            this.suggestionsContainer.appendChild(card);
        });
    }
    
    getSuggestionIcon(type) {
        const icons = {
            'favorites': '⭐',
            'variations': '🔄',
            'trending': '🔥',
            'quick_actions': '⚡',
            'popular': '📈'
        };
        return icons[type] || '☕';
    }
    
    handleSuggestionClick(item) {
        // Send the suggestion as if the user said it
        if (this.dc && this.dc.readyState === 'open') {
            const message = {
                type: 'conversation.item.create',
                item: {
                    type: 'message',
                    role: 'user',
                    content: [{
                        type: 'input_text',
                        text: item.text
                    }]
                }
            };
            
            this.dc.send(JSON.stringify(message));
            // Message will be added when transcription event is received
            
            // Update last interaction time
            this.lastInteractionTime = Date.now();
            
            // Trigger response
            this.dc.send(JSON.stringify({ type: 'response.create' }));
            
            // Update suggestions after interaction
            setTimeout(() => this.updateSuggestions(), 500);
        }
    }
    
    speakToAgent(text) {
        // Method to be called from menu cards
        if (this.dc && this.dc.readyState === 'open') {
            const message = {
                type: 'conversation.item.create',
                item: {
                    type: 'message',
                    role: 'user',
                    content: [{
                        type: 'input_text',
                        text: text
                    }]
                }
            };
            
            this.dc.send(JSON.stringify(message));
            // Message will be added when transcription event is received
            
            // Update last interaction time
            this.lastInteractionTime = Date.now();
            
            // Trigger response
            this.dc.send(JSON.stringify({ type: 'response.create' }));
            
            // Update suggestions after interaction
            setTimeout(() => this.updateSuggestions(), 500);
        } else {
            // If not connected, try to connect first
            this.connect().then(() => {
                setTimeout(() => this.speakToAgent(text), 1000);
            });
        }
    }
    
    onSessionStarted() {
        console.log('[Session] Started successfully');
        this.isConnected = true;
        this.sessionActive = true;
        
        // Hide initial prompt and show controls
        if (this.initialPrompt) {
            this.initialPrompt.style.display = 'none';
        }
        if (this.controlPanel) {
            this.controlPanel.style.display = 'block';
        }
        if (this.audioVisualizers) {
            this.audioVisualizers.style.display = 'block';
            // Recalculate canvas dimensions after making visible
            requestAnimationFrame(() => {
                if (this.micVisualizerCanvas && this.agentVisualizerCanvas) {
                    this.micVisualizerCanvas.width = this.micVisualizerCanvas.offsetWidth || 400;
                    this.micVisualizerCanvas.height = this.micVisualizerCanvas.offsetHeight || 80;
                    this.agentVisualizerCanvas.width = this.agentVisualizerCanvas.offsetWidth || 400;
                    this.agentVisualizerCanvas.height = this.agentVisualizerCanvas.offsetHeight || 80;
                    console.log('[Visualizers] Dimensions updated after display');
                }
            });
        }
        if (this.suggestionsPanel) {
            this.suggestionsPanel.style.display = 'block';
        }
        
        this.clearChat();
        
        // Start the conversation immediately
        if (this.dc && this.dc.readyState === 'open') {
            setTimeout(() => {
                this.sendDataChannelMessage({
                    type: 'response.create'
                });
            }, 500);
        }
    }
    
    toggleMute() {
        if (!this.isConnected || !this.sessionActive) return;
        
        this.isMuted = !this.isMuted;
        
        // Update audio track
        if (this.audioTrack) {
            this.audioTrack.enabled = !this.isMuted;
        }
        
        // Update UI
        if (this.muteButton) {
            if (this.isMuted) {
                this.muteButton.classList.add('muted');
                this.muteButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
                this.muteButton.classList.add('bg-red-600', 'hover:bg-red-700');
            } else {
                this.muteButton.classList.remove('muted');
                this.muteButton.classList.remove('bg-red-600', 'hover:bg-red-700');
                this.muteButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
            }
        }
        
        if (this.muteText) {
            this.muteText.textContent = this.isMuted ? 'Unmute' : 'Mute';
        }
        
        if (this.muteIcon && this.unmuteIcon) {
            if (this.isMuted) {
                this.muteIcon.classList.add('hidden');
                this.unmuteIcon.classList.remove('hidden');
            } else {
                this.muteIcon.classList.remove('hidden');
                this.unmuteIcon.classList.add('hidden');
            }
        }
        
        // Show/hide speaking indicator based on mute status
        if (this.isMuted) {
            this.hideUserSpeakingIndicator();
        }
    }
    
    
    startSuggestionUpdates() {
        // Clear any existing interval
        if (this.suggestionUpdateInterval) {
            clearInterval(this.suggestionUpdateInterval);
        }
        
        // Update suggestions every 15 seconds or after interaction
        this.suggestionUpdateInterval = setInterval(() => {
            const timeSinceLastInteraction = Date.now() - this.lastInteractionTime;
            
            // Only update if there's been recent activity (within last minute)
            if (timeSinceLastInteraction < 60000 && this.currentUserId) {
                this.updateSuggestions();
            }
        }, 15000);
    }
    
    stopSuggestionUpdates() {
        if (this.suggestionUpdateInterval) {
            clearInterval(this.suggestionUpdateInterval);
            this.suggestionUpdateInterval = null;
        }
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new RealtimeVoiceAgent();
    // Make app accessible globally for menu card clicks
    window.app = app;
});