const express = require('express');
const router = express.Router();
const brandingController = require('../controllers/branding');

router.get('/config', brandingController.getBranding);
router.patch('/:organizationId', brandingController.updateBranding);

module.exports = router;
