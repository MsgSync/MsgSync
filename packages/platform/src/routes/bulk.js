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
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

// Contact Lists
router.get('/lists', getLists);
router.post('/lists', createList);
router.post('/lists/:listId/contacts', addContacts);

// Campaigns
router.get('/campaigns', getCampaigns);
router.get('/campaigns/:id', getCampaignById);
router.post('/campaigns', createCampaign);
router.post('/campaigns/:id/start', startCampaign);
router.post('/campaigns/:id/pause', pauseCampaign);
router.post('/campaigns/:id/resume', resumeCampaign);
router.delete('/campaigns/:id', deleteCampaign);

module.exports = router;
