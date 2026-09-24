const express = require('express');
const router = express.Router();
const securityController = require('../controllers/security');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/2fa/setup', securityController.setup2FA);
router.post('/2fa/enable', securityController.enable2FA);
router.post('/2fa/disable', securityController.disable2FA);
router.post('/restrictions', securityController.updateRestrictions);

module.exports = router;
