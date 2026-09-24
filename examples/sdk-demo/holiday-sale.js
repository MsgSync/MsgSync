const axios = require('axios');

/**
 * Holiday Campaign: Mega Winter Sale ❄️
 * Demonstrates time-limited offers and discount code personalization.
 */
async function runHolidayCampaign() {
    console.log('--- ❄️ MsgSync "Winter Mega Sale" Campaign ---');

    const API_BASE = 'http://localhost:3001/api/bulk';
    const HEADERS = { headers: { 'X-API-Key': 'demo-api-key' } };

    try {
    // 1. Create the "Holiday Shoppers" list
        const listResp = await axios.post(
            `${API_BASE}/lists`,
            { name: 'Holiday Shoppers' },
            HEADERS
        );
        const listId = listResp.data.data.id;

        // 2. Add contacts with personalized discount codes
        console.log('2. Importing shoppers with unique discount codes...');
        await axios.post(
            `${API_BASE}/lists/${listId}/contacts`,
            {
                contacts: [
                    {
                        phone: '+14155551111',
                        firstName: 'Alice',
                        attributes: { code: 'WINTER50', off: '50%' }
                    },
                    {
                        phone: '+12125552222',
                        firstName: 'Bob',
                        attributes: { code: 'SNOW30', off: '30%' }
                    }
                ]
            },
            HEADERS
        );

        // 3. Define the Holiday Template
        const holidayTemplate =
      "Season's Greetings {{firstName}}! ❄️ Gift yourself with our Winter Sale. Use code {{code}} for {{off}} OFF everything! Valid until Jan 5. Shop now: https://example.com/sale";

        console.log('\n3. Creating Holiday Campaign...');
        const campaignResp = await axios.post(
            `${API_BASE}/campaigns`,
            {
                name: 'Winter Sale 2025',
                contactListId: listId,
                template: holidayTemplate
            },
            HEADERS
        );
        const campaignId = campaignResp.data.data.id;

        // 4. Launch
        await axios.post(`${API_BASE}/campaigns/${campaignId}/start`, {}, HEADERS);

        console.log('\n--- ❄️ Holiday Campaign Launched ---');
        console.log(
            '- To Alice: "Season\'s Greetings Alice! ❄️ ... Use code WINTER50 for 50% OFF..."'
        );
    } catch (error) {
        console.error('Holiday Error:', error.response?.data || error.message);
    }
}

runHolidayCampaign();
