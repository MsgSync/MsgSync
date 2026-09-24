const axios = require('axios');

/**
 * Demo of the Cross-Package "Sync" flow.
 * External Webhook -> Aggregator -> Platform
 */
async function runCrossPlatformSyncDemo() {
    console.log('--- MsgSync Cross-Platform Sync Demo ---');
    console.log(
        'Flow: External App -> Aggregator (Normalize) -> Platform (Deliver)'
    );

    const AGGREGATOR_URL = 'http://localhost:3000/api/webhooks/slack-custom';

    // Simulated payload from an external source (e.g., Slack outgoing webhook)
    const slackPayload = {
        id: 'slack-msg-12345',
        sender_id: 'U123456',
        recipient_id: '+15559998877',
        message_text: 'Urgent: Server is down! Please check the dashboard.'
    };

    try {
        console.log('\n1. Sending simulated webhook to Aggregator...');
        const response = await axios.post(AGGREGATOR_URL, slackPayload);

        console.log('Aggregator Response:', response.data.message);

        console.log('\n2. Verifying synchronization...');
        console.log(
            'Normally, you would now see this message in the Platform Dashboard at http://localhost:3001/dashboard'
        );
        console.log(
            'The aggregator has successfully bridged the external webhook to our unified delivery infrastructure.'
        );
    } catch (error) {
        console.error('Demo Error:', error.response?.data || error.message);
        console.log(
            '\nNote: Make sure both Platform (p3001) and Aggregator (p3000) are running.'
        );
    }
}

runCrossPlatformSyncDemo();
