const axios = require('axios');

async function runBulkDemo() {
    console.log('--- MsgSync Bulk SMS & Campaign Demo ---');

    const API_BASE = 'http://localhost:3001/api/bulk';
    const HEADERS = { headers: { 'X-API-Key': 'demo-api-key' } };

    try {
    // 1. Create a Contact List
        console.log('\n1. Creating a contact list "Summer Promo 2025"...');
        const listResp = await axios.post(
            `${API_BASE}/lists`,
            { name: 'Summer Promo 2025' },
            HEADERS
        );
        const listId = listResp.data.data.id;
        console.log('List Created ID:', listId);

        // 2. Add Contacts with custom variables
        console.log('\n2. Importing contacts with variables...');
        await axios.post(
            `${API_BASE}/lists/${listId}/contacts`,
            {
                contacts: [
                    {
                        phone: '+12223334444',
                        firstName: 'John',
                        attributes: { discount: '20%', code: 'SAVE20' }
                    },
                    {
                        phone: '+15556667777',
                        firstName: 'Sarah',
                        attributes: { discount: '50%', code: 'VIP50' }
                    }
                ]
            },
            HEADERS
        );
        console.log('Contacts imported.');

        // 3. Create a Campaign with Template
        console.log('\n3. Creating targeted campaign template...');
        const campaignResp = await axios.post(
            `${API_BASE}/campaigns`,
            {
                name: 'Summer Flash Sale',
                contactListId: listId,
                template:
          'Hey {{firstName}}! Use code {{code}} for a {{discount}} discount at MsgSync!'
            },
            HEADERS
        );
        const campaignId = campaignResp.data.data.id;
        console.log('Campaign Created ID:', campaignId);

        // 4. Start the Campaign
        console.log('\n4. Executing campaign...');
        const startResp = await axios.post(
            `${API_BASE}/campaigns/${campaignId}/start`,
            {},
            HEADERS
        );
        console.log('Status:', startResp.data.message);

        console.log('\n--- Demo Complete ---');
        console.log(
            'Check the dashboard at http://localhost:3001/dashboard to see the personalized messages being sent!'
        );
    } catch (error) {
        console.error('Bulk Demo Error:', error.response?.data || error.message);
    }
}

runBulkDemo();
