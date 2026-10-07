const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const messageQueue = require('../queue/messageQueue');

/**
 * Service to handle Bulk SMS Campaigns and Contact Management.
 */
class CampaignService {
    renderTemplate(template, variables) {
        return template.replace(/{{\s*([\w.-]+)\s*}}/g, (match, key) =>
            Object.prototype.hasOwnProperty.call(variables, key) && variables[key] != null
                ? String(variables[key])
                : ''
        );
    }

    /**
     * Atomically moves a campaign into a new status when it is currently in one of the allowed states.
     * @returns {Promise<boolean>} true when the transition was applied.
     */
    async transition(campaignId, fromStatuses, toStatus, extra = {}) {
        const result = await prisma.campaign.updateMany({
            where: { id: campaignId, status: { in: fromStatuses } },
            data: { status: toStatus, ...extra }
        });
        return result.count > 0;
    }

    /**
     * Pauses queued messages so workers skip them until the campaign is resumed.
     */
    async pauseMessages(campaignId) {
        await prisma.message.updateMany({
            where: { campaignId, status: 'queued' },
            data: { status: 'paused' }
        });
    }

    /**
     * Re-queues messages that were paused along with the campaign.
     */
    async requeuePausedMessages(campaignId) {
        const paused = await prisma.message.findMany({
            where: { campaignId, status: 'paused' },
            select: { id: true, scheduledAt: true }
        });

        for (const message of paused) {
            await prisma.message.update({ where: { id: message.id }, data: { status: 'queued' } });
            const delay = message.scheduledAt
                ? Math.max(0, new Date(message.scheduledAt).getTime() - Date.now())
                : 0;
            await messageQueue.add({ messageId: message.id }, { delay });
        }
    }

    /**
     * Creates a message for each contact in the list that has not been messaged yet,
     * substituting variables. Safe to call again after a pause/resume.
     * The campaign must already be in the 'running' state.
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
        if (campaign.status !== 'running') return;

        const alreadyMessaged = new Set(
            (
                await prisma.message.findMany({
                    where: { campaignId },
                    select: { recipient: true }
                })
            ).map((m) => m.recipient)
        );

        console.log(
            `Processing Bulk Campaign: ${campaign.name} for ${campaign.contactList.contacts.length} contacts`
        );

        const delay = campaign.scheduledAt
            ? Math.max(0, new Date(campaign.scheduledAt).getTime() - Date.now())
            : 0;

        for (const contact of campaign.contactList.contacts) {
            if (alreadyMessaged.has(contact.phone)) continue;

            const current = await prisma.campaign.findUnique({
                where: { id: campaignId },
                select: { status: true }
            });
            if (!current || current.status !== 'running') {
                console.log(`Campaign ${campaignId} is ${current?.status}, stopping.`);
                return;
            }

            const content = this.renderTemplate(campaign.template, {
                ...(contact.attributes || {}),
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                phone: contact.phone
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
                    organizationId: campaign.organizationId,
                    campaignId: campaign.id,
                    status: 'queued',
                    scheduledAt: campaign.scheduledAt || new Date(),
                    metadata: messageMetadata
                }
            });

            await messageQueue.add({ messageId: message.id }, { delay });
        }

        await this.transition(campaignId, ['running'], 'completed', { completedAt: new Date() });
    }

    /**
     * Imports contacts into a list.
     */
    async importContacts(listId, contactsData) {
        const list = await prisma.contactList.findUnique({ where: { id: listId } });
        if (!list) throw new Error('List not found');

        for (const data of contactsData) {
            const existing = await prisma.contact.findFirst({
                where: { phone: data.phone, lists: { some: { id: listId } } }
            });

            if (existing) {
                await prisma.contact.update({
                    where: { id: existing.id },
                    data: {
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        attributes: data.attributes
                    }
                });
                continue;
            }

            await prisma.contact.create({
                data: {
                    phone: data.phone,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    attributes: data.attributes,
                    lists: { connect: { id: listId } }
                }
            });
        }
    }
}

module.exports = new CampaignService();
