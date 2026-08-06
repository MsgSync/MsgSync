const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const campaignService = require('../services/campaignService');

/**
 * Controller for Contact Lists and Campaigns.
 */

async function createList(req, res) {
    const { name } = req.body;
    try {
        const list = await prisma.contactList.create({
            data: {
                name,
                apiKeyId: req.apiKey.id,
                organizationId: req.organization ? req.organization.id : null
            }
        });
        res.status(201).json({ status: 'success', data: list });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function addContacts(req, res) {
    const { listId } = req.params;
    const { contacts } = req.body; // Array of contact objects
    try {
        await campaignService.importContacts(listId, contacts);
        res
            .status(200)
            .json({ status: 'success', message: 'Contacts imported successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function createCampaign(req, res) {
    const {
        name,
        template,
        contactListId,
        scheduledAt,
        senderId,
        enableTracking,
        enableWebhooks
    } = req.body;
    try {
    // Validate sender ID format if provided
        if (senderId) {
            const isAlphanumeric = /^[a-zA-Z0-9]{1,11}$/.test(senderId);
            const isPhoneNumber = /^\+?[1-9]\d{1,14}$/.test(senderId);

            if (!isAlphanumeric && !isPhoneNumber) {
                return res.status(400).json({
                    status: 'error',
                    message:
            'Sender ID must be alphanumeric (max 11 chars) or a valid phone number'
                });
            }
        }

        const campaign = await prisma.campaign.create({
            data: {
                name,
                template,
                contactListId,
                senderId: senderId || null,
                apiKeyId: req.apiKey.id,
                organizationId: req.organization ? req.organization.id : null,
                scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                enableTracking: enableTracking !== undefined ? enableTracking : true,
                enableWebhooks: enableWebhooks !== undefined ? enableWebhooks : false,
                status: 'draft'
            },
            include: {
                contactList: {
                    include: { contacts: true }
                }
            }
        });

        // Audit Log
        const auditService = require('../services/auditService');
        await auditService.log({
            action: 'CREATE_CAMPAIGN',
            entity: 'Campaign',
            entityId: campaign.id,
            userId: req.user ? req.user.id : null,
            organizationId: req.organization ? req.organization.id : 'SYSTEM',
            metadata: { name: campaign.name }
        });

        res.status(201).json({ status: 'success', data: campaign });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function startCampaign(req, res) {
    const { id } = req.params;
    try {
    // Run in background
        campaignService
            .processCampaign(id)
            .catch((err) => console.error('Campaign background error:', err));

        // Audit Log
        const auditService = require('../services/auditService');
        await auditService.log({
            action: 'START_CAMPAIGN',
            entity: 'Campaign',
            entityId: id,
            userId: req.user ? req.user.id : null,
            organizationId: req.organization ? req.organization.id : 'SYSTEM'
        });

        res
            .status(202)
            .json({ status: 'success', message: 'Campaign execution started' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function getCampaigns(req, res) {
    try {
        const campaigns = await prisma.campaign.findMany({
            where: {
                apiKeyId: req.apiKey.id
            },
            include: {
                contactList: {
                    include: { contacts: true }
                },
                messages: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({ status: 'success', data: campaigns });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function getCampaignById(req, res) {
    const { id } = req.params;
    try {
        const campaign = await prisma.campaign.findUnique({
            where: { id },
            include: {
                contactList: {
                    include: { contacts: true }
                },
                messages: true
            }
        });

        if (!campaign) {
            return res
                .status(404)
                .json({ status: 'error', message: 'Campaign not found' });
        }

        res.status(200).json({ status: 'success', data: campaign });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function pauseCampaign(req, res) {
    const { id } = req.params;
    try {
        const campaign = await prisma.campaign.update({
            where: { id },
            data: { status: 'paused' }
        });

        // Audit Log
        const auditService = require('../services/auditService');
        await auditService.log({
            action: 'PAUSE_CAMPAIGN',
            entity: 'Campaign',
            entityId: id,
            organizationId: campaign.organizationId || 'SYSTEM',
            metadata: { name: campaign.name }
        });

        res.status(200).json({ status: 'success', data: campaign });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function resumeCampaign(req, res) {
    const { id } = req.params;
    try {
        const campaign = await prisma.campaign.findUnique({ where: { id } });

        if (!campaign) {
            return res
                .status(404)
                .json({ status: 'error', message: 'Campaign not found' });
        }

        const newStatus =
      campaign.scheduledAt && new Date(campaign.scheduledAt) > new Date()
          ? 'scheduled'
          : 'running';

        const updated = await prisma.campaign.update({
            where: { id },
            data: { status: newStatus }
        });

        // Audit Log
        const auditService = require('../services/auditService');
        await auditService.log({
            action: 'RESUME_CAMPAIGN',
            entity: 'Campaign',
            entityId: id,
            organizationId: updated.organizationId || 'SYSTEM',
            metadata: { name: updated.name }
        });

        // If resuming to running, restart campaign processing
        if (newStatus === 'running') {
            campaignService
                .processCampaign(id)
                .catch((err) => console.error('Campaign resume error:', err));
        }

        res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function deleteCampaign(req, res) {
    const { id } = req.params;
    try {
    // Check if campaign can be deleted (not running)
        const campaign = await prisma.campaign.findUnique({ where: { id } });

        if (!campaign) {
            return res
                .status(404)
                .json({ status: 'error', message: 'Campaign not found' });
        }

        if (campaign.status === 'running') {
            return res.status(400).json({
                status: 'error',
                message: 'Cannot delete a running campaign. Please pause it first.'
            });
        }

        const name = campaign.name;
        const orgId = campaign.organizationId;
        await prisma.campaign.delete({ where: { id } });

        // Audit Log
        const auditService = require('../services/auditService');
        await auditService.log({
            action: 'DELETE_CAMPAIGN',
            entity: 'Campaign',
            entityId: id,
            userId: req.user ? req.user.id : null,
            organizationId: orgId || 'SYSTEM',
            metadata: { name }
        });

        res
            .status(200)
            .json({ status: 'success', message: 'Campaign deleted successfully' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

async function getLists(req, res) {
    try {
        const lists = await prisma.contactList.findMany({
            where: {
                apiKeyId: req.apiKey.id
            },
            include: {
                contacts: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        res.status(200).json({ status: 'success', data: lists });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = {
    createList,
    getLists,
    addContacts,
    createCampaign,
    getCampaigns,
    getCampaignById,
    startCampaign,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign
};
