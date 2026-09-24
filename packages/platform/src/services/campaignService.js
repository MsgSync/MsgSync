const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const messageQueue = require('../queue/messageQueue');

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
                }
            }
        });

        if (!campaign) throw new Error('Campaign not found');

        console.log(
            `Processing Bulk Campaign: ${campaign.name} for ${campaign.contactList.contacts.length} contacts`
        );

        for (const contact of campaign.contactList.contacts) {
            // Personalize content
            let content = campaign.template;
            const variables = {
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                phone: contact.phone,
                ...(contact.attributes || {})
            };

            // Replace {{variableName}}
            Object.entries(variables).forEach(([key, value]) => {
                content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
            });

            // Create message record with sender ID in metadata
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

            // Calculate delay if scheduled
            const delay = campaign.scheduledAt
                ? Math.max(0, new Date(campaign.scheduledAt).getTime() - Date.now())
                : 0;

            // Add to message queue
            await messageQueue.add({ messageId: message.id }, { delay });
        }

        // Update campaign status
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: {
                status: 'running',
                ...(campaign.scheduledAt && new Date(campaign.scheduledAt) <= new Date()
                    ? {}
                    : {})
            }
        });
    }

    /**
   * Imports contacts into a list.
   */
    async importContacts(listId, contactsData) {
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

            // Connect to list
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
