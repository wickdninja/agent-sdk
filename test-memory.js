const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001';

async function testMemoryIntegration() {
    console.log('🧪 Testing Zep Memory Integration\n');
    
    const userId = 'test_user_' + Date.now();
    const sessionId = 'test_session_' + Date.now();
    
    try {
        // 1. Test user identification
        console.log('1. Testing user identification...');
        const userResponse = await fetch(`${BASE_URL}/api/memory/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                sessionId: sessionId,
                type: 'user_identified',
                data: {
                    name: 'Test User',
                    firstTime: true,
                    isReturning: false,
                    visitCount: 1
                }
            })
        });
        const userResult = await userResponse.json();
        console.log('   ✅ User identified:', userResult.message);
        
        // 2. Test adding messages
        console.log('\n2. Testing message storage...');
        const messageResponse = await fetch(`${BASE_URL}/api/memory/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                sessionId: sessionId,
                type: 'message',
                data: {
                    content: 'I would like a large cappuccino please',
                    role: 'user'
                }
            })
        });
        const messageResult = await messageResponse.json();
        console.log('   ✅ Message stored:', messageResult.message);
        
        // 3. Test order item tracking
        console.log('\n3. Testing order item tracking...');
        const orderItemResponse = await fetch(`${BASE_URL}/api/memory/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                sessionId: sessionId,
                type: 'order_item',
                data: {
                    itemId: 'cappuccino',
                    itemName: 'Cappuccino',
                    quantity: 1,
                    customizations: ['oat milk', 'extra shot']
                }
            })
        });
        const orderItemResult = await orderItemResponse.json();
        console.log('   ✅ Order item tracked:', orderItemResult.message);
        
        // 4. Test preference recording
        console.log('\n4. Testing preference recording...');
        const prefResponse = await fetch(`${BASE_URL}/api/memory/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                sessionId: sessionId,
                type: 'preference',
                data: {
                    preference: 'Prefers oat milk over regular milk',
                    rating: 0.9
                }
            })
        });
        const prefResult = await prefResponse.json();
        console.log('   ✅ Preference recorded:', prefResult.message);
        
        // 5. Test context retrieval
        console.log('\n5. Testing context retrieval...');
        const contextResponse = await fetch(`${BASE_URL}/api/memory/context/${userId}`);
        const context = await contextResponse.json();
        console.log('   ✅ Context retrieved:');
        if (context.facts && context.facts.length > 0) {
            console.log('   Facts:');
            context.facts.forEach(f => console.log(`     - ${f.fact || f}`));
        }
        if (context.summary) {
            console.log('   Summary:', context.summary.substring(0, 100) + '...');
        }
        
        // 6. Test user facts retrieval
        console.log('\n6. Testing facts retrieval...');
        const factsResponse = await fetch(`${BASE_URL}/api/memory/facts/${userId}`);
        const factsData = await factsResponse.json();
        console.log('   ✅ Retrieved', factsData.count, 'facts');
        
        // 7. Test memory search
        console.log('\n7. Testing memory search...');
        const searchResponse = await fetch(`${BASE_URL}/api/memory/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                query: 'cappuccino oat milk',
                limit: 5
            })
        });
        const searchResults = await searchResponse.json();
        console.log('   ✅ Search found', searchResults.count, 'results');
        
        // 8. Test order completion
        console.log('\n8. Testing order completion...');
        const orderCompleteResponse = await fetch(`${BASE_URL}/api/memory/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                sessionId: sessionId,
                type: 'order_completed',
                data: {
                    orderId: 'ORD-12345',
                    items: [{
                        itemId: 'cappuccino',
                        name: 'Cappuccino',
                        quantity: 1,
                        customizations: ['oat milk', 'extra shot']
                    }],
                    total: 5.75
                }
            })
        });
        const orderCompleteResult = await orderCompleteResponse.json();
        console.log('   ✅ Order completion recorded:', orderCompleteResult.message);
        
        // 9. Test session end
        console.log('\n9. Testing session end...');
        const sessionEndResponse = await fetch(`${BASE_URL}/api/memory/update`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                sessionId: sessionId,
                type: 'session_end',
                data: {}
            })
        });
        const sessionEndResult = await sessionEndResponse.json();
        console.log('   ✅ Session ended:', sessionEndResult.message);
        
        console.log('\n✨ All memory integration tests passed successfully!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testMemoryIntegration().then(() => {
    console.log('\n🎉 Memory integration test complete!');
    process.exit(0);
}).catch(error => {
    console.error('Test error:', error);
    process.exit(1);
});