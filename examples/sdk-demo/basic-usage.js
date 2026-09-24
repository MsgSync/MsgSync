const MsgSyncClient = require('../../sdk/js/src/index');

async function runDemo() {
    console.log('--- MsgSync SDK Demo ---');

    // Initialize the client
    // Note: In production, use your real API key and platform URL
    const client = new MsgSyncClient({
        apiKey: 'demo-api-key',
        baseUrl: 'http://localhost:3001/api'
    });

    try {
    // 1. Send a message
        console.log('\n1. Sending a new message...');
        const sendResponse = await client.sendMessage({
            recipient: '+15551234567',
            content: 'Hello, this is a test message from the MsgSync SDK!',
            metadata: {
                campaign: 'onboarding',
                userId: 'user_123'
            }
        });

        const messageId = sendResponse.data.id;
        console.log(`Success! Message ID: ${messageId}`);

        // 2. Check message status
        console.log('\n2. Checking message status...');
        const statusResponse = await client.getMessageStatus(messageId);
        console.log('Current status:', statusResponse.data.status);

        // 3. List recent messages
        console.log('\n3. Fetching recent messages...');
        const listResponse = await client.listMessages();
        console.log(`Total messages in list: ${listResponse.data.length}`);
    } catch (error) {
        console.error('Demo Error:', error.message);
        console.log(
            '\nTip: Make sure the MsgSync Platform is running at http://localhost:3001'
        );
    }
}

runDemo();
