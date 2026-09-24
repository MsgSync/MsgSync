const MsgSyncClient = require('../../sdk/js/src/index');

async function runOTPDemo() {
    console.log('--- MsgSync OTP Verification Demo ---');

    const client = new MsgSyncClient({
        apiKey: 'demo-api-key',
        baseUrl: 'http://localhost:3001/api'
    });

    const recipient = '+15550001122';

    try {
    // 1. Request an OTP
        console.log(`\n1. Requesting OTP for ${recipient}...`);
        const sendResp = await client.sendOTP({
            recipient: recipient,
            ttl: 60,
            length: 4
        });

        console.log('OTP Sent status:', sendResp.status);
        console.log('Message:', sendResp.message);

        // 2. Validate the OTP
        console.log('\n2. Verifying a WRONG code...');
        try {
            await client.verifyOTP(recipient, '0000');
        } catch (e) {
            console.log('Verification failed as expected:', e.message);
        }
    } catch (error) {
        console.error('OTP Demo Error:', error.message);
    }
}

runOTPDemo();
