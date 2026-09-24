const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/bulk');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

// Contact Lists
router.get('/lists', authorize(PERMISSIONS.BULK_READ), getLists);
router.post('/lists', authorize(PERMISSIONS.CONTACT_MANAGE), createList);
router.post('/lists/:listId/contacts', authorize(PERMISSIONS.CONTACT_MANAGE), addContacts);

// Campaigns
router.get('/campaigns', authorize(PERMISSIONS.BULK_READ), getCampaigns);
router.get('/campaigns/:id', authorize(PERMISSIONS.BULK_READ), getCampaignById);
router.post('/campaigns', authorize(PERMISSIONS.BULK_WRITE), createCampaign);
router.post('/campaigns/:id/start', authorize(PERMISSIONS.BULK_WRITE), startCampaign);
router.post('/campaigns/:id/pause', authorize(PERMISSIONS.BULK_WRITE), pauseCampaign);
router.post('/campaigns/:id/resume', authorize(PERMISSIONS.BULK_WRITE), resumeCampaign);
router.delete('/campaigns/:id', authorize(PERMISSIONS.BULK_WRITE), deleteCampaign);

module.exports = router;
