const axios = require('axios');

/**
 * Security Alert: Critical Account Notification ⚠️
 * Demonstrates high-priority alerts with browser/device context.
 */
async function runSecurityCampaign() {
    console.log('--- ⚠️ MsgSync Security Alert Campaign ---');

    const API_BASE = 'http://localhost:3001/api/bulk';
    const HEADERS = { headers: { 'X-API-Key': 'demo-api-key' } };

    try {
    // 1. Create the "Impacted Users" list
        const listResp = await axios.post(
            `${API_BASE}/lists`,
            { name: 'Security Notifications' },
            HEADERS
        );
        const listId = listResp.data.data.id;

        // 2. Add contacts with login context
        console.log('2. Importing users requiring alerts...');
        await axios.post(
            `${API_BASE}/lists/${listId}/contacts`,
            {
                contacts: [
                    {
                        phone: '+14155559999',
                        firstName: 'Charlie',
                        attributes: { device: 'Chrome on Mac', location: 'London, UK' }
                    }
                ]
            },
            HEADERS
        );

        // 3. Define the Security Template
        const securityTemplate =
      "Security Alert: Hi {{firstName}}, a new login was detected for your account from {{device}} in {{location}}. If this wasn't you, secure your account immediately: https://msgsync.com/secure";

        console.log('\n3. Creating Security Campaign...');
        const campaignResp = await axios.post(
            `${API_BASE}/campaigns`,
            {
                name: 'Urgent Login Alert',
                contactListId: listId,
                template: securityTemplate
            },
            HEADERS
        );
        const campaignId = campaignResp.data.data.id;

        // 4. Launch (Immediate)
        await axios.post(`${API_BASE}/campaigns/${campaignId}/start`, {}, HEADERS);

        console.log('\n--- ⚠️ Security Alert Dispatched ---');
        console.log(
            '- To Charlie: "Security Alert: Hi Charlie, a new login was detected... from Chrome on Mac in London, UK..."'
        );
    } catch (error) {
        console.error(
            'Security Alert Error:',
            error.response?.data || error.message
        );
    }
}

runSecurityCampaign();
