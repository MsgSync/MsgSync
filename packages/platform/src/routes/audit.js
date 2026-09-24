const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit');
const authenticate = require('../middleware/auth');

router.use(authenticate);
router.get('/', auditController.getLogs);

module.exports = router;
