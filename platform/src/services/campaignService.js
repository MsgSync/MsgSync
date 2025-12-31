const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const messageQueue = require('../queue/messageQueue');
const axios = require('axios');

/**
 * Service to handle Bulk SMS Campaigns and Contact Management.
 */
class CampaignService {
    /**
     * Creates or updates a message for each contact in the list, substituting variables.
     * @param {string} campaignId - The ID of the campaign to execute.
     */
    async processCampaign(campaignId) {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: {
                contactList: {
                    include: { contacts: true }
                },
                recipients: true
            }
        });

        if (!campaign) throw new Error('Campaign not found');

        // If this campaign has Go-processed recipients, delegate to Campaign Engine
        if (campaign.recipients && campaign.recipients.length > 0) {
            console.log(`Delegating High-Volume Campaign: ${campaign.name} to Go Engine`);
            try {
                await axios.post(`${process.env.CAMPAIGN_ENGINE_URL || 'http://localhost:3002'}/start`, {
                    campaignId: campaign.id
                });
                return;
            } catch (err) {
                console.error('Failed to delegate to campaign-engine:', err.message);
                throw new Error('Failed to start high-volume processing engine');
            }
        }

        console.log(`Processing Regular Bulk Campaign: ${campaign.name} for ${campaign.contactList.contacts.length} contacts`);

        for (const contact of campaign.contactList.contacts) {
            // ... (rest of existing logic)
            let content = campaign.template;
            const variables = {
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                phone: contact.phone,
                ...(contact.attributes || {})
            };

            Object.entries(variables).forEach(([key, value]) => {
                content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
            });

            const messageMetadata = {};
            if (campaign.senderId) {
                messageMetadata.senderId = campaign.senderId;
            }
            if (campaign.enableTracking) {
                messageMetadata.tracking = true;
            }

            const message = await prisma.message.create({
                data: {
                    recipient: contact.phone,
                    content: content,
                    apiKeyId: campaign.apiKeyId,
                    campaignId: campaign.id,
                    status: 'queued',
                    scheduledAt: campaign.scheduledAt || new Date(),
                    metadata: messageMetadata
                }
            });

            const delay = campaign.scheduledAt ? Math.max(0, new Date(campaign.scheduledAt).getTime() - Date.now()) : 0;
            await messageQueue.add({ messageId: message.id }, { delay });
        }

        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'running' }
        });
    }

    /**
     * Imports contacts into a list.
     */
    async importContacts(listId, contactsData) {
        // ... (existing import logic)
        const list = await prisma.contactList.findUnique({ where: { id: listId } });
        if (!list) throw new Error('List not found');

        for (const data of contactsData) {
            const contact = await prisma.contact.upsert({
                where: { phone: data.phone },
                update: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    attributes: data.attributes
                },
                create: {
                    phone: data.phone,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    attributes: data.attributes
                }
            });

            await prisma.contactList.update({
                where: { id: listId },
                data: {
                    contacts: { connect: { id: contact.id } }
                }
            });
        }
    }
}

module.exports = new CampaignService();
