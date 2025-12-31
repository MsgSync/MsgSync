const express = require('express');
const router = express.Router();
const callbacksController = require('../controllers/callbacks');

// Note: Provider callbacks are usually public but should be validated (e.g. Twilio Signature)
router.post('/twilio', express.urlencoded({ extended: false }), callbacksController.twilioCallback);

module.exports = router;
