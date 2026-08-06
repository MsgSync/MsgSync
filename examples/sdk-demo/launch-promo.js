const axios = require('axios');

/**
 * Promotional Campaign: Launching the MsgSync Premium Console 🚀
 * This script demonstrates how to use the Bulk API to send personalized
 * promotional messages to a list of early adopters.
 */
async function runLaunchCampaign() {
    console.log('--- 🚀 MsgSync "Premium Console" Launch Campaign ---');

    const API_BASE = 'http://localhost:3001/api/bulk';
    const HEADERS = { headers: { 'X-API-Key': 'demo-api-key' } };

    try {
    // 1. Create the "Early Adopters" list
        console.log('\n1. Segementing audience: "Early Adopters"...');
        const listResp = await axios.post(
            `${API_BASE}/lists`,
            { name: 'Early Adopters' },
            HEADERS
        );
        const listId = listResp.data.data.id;

        // 2. Add VIP contacts with custom traits
        console.log('2. Importing VIP contacts...');
        await axios.post(
            `${API_BASE}/lists/${listId}/contacts`,
            {
                contacts: [
                    {
                        phone: '+14155550123',
                        firstName: 'Alex',
                        attributes: { tier: 'Platinum', perk: 'Lifetime Access' }
                    },
                    {
                        phone: '+12125550987',
                        firstName: 'Jordan',
                        attributes: { tier: 'Gold', perk: 'Exclusive Badge' }
                    }
                ]
            },
            HEADERS
        );

        // 3. Define the Promotional Template
        // We use double braces for variable substitution implemented in campaignService.js
        const promoTemplate =
      'Hi {{firstName}}! 🚀 The future is here. Your {{tier}} account now has access to the MsgSync Premium Console! Enjoy your gift of {{perk}}. Check it out: https://msgsync.com/console';

        console.log('\n3. Creating "Console Launch" Campaign...');
        const campaignResp = await axios.post(
            `${API_BASE}/campaigns`,
            {
                name: 'Console Launch Promo',
                contactListId: listId,
                template: promoTemplate
            },
            HEADERS
        );
        const campaignId = campaignResp.data.data.id;

        // 4. BLAST OFF!
        console.log('4. Triggering campaign delivery...');
        await axios.post(`${API_BASE}/campaigns/${campaignId}/start`, {}, HEADERS);

        console.log('\n--- 🚀 Campaign Launched Successfully ---');
        console.log('Personalized Messages Sent:');
        console.log(
            '- To Alex: "Hi Alex! 🚀 The future is here. Your Platinum account now has access..."'
        );
        console.log(
            '- To Jordan: "Hi Jordan! 🚀 The future is here. Your Gold account now has access..."'
        );

        console.log(
            '\nView the real-time delivery stats on your new dashboard: http://localhost:3001/dashboard'
        );
    } catch (error) {
        console.error('Launch Error:', error.response?.data || error.message);
    }
}

runLaunchCampaign();
