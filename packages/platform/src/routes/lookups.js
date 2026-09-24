const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookups');

router.get('/info', lookupController.getLookup);
router.get('/recent', lookupController.listRecent);
router.get('/configs', lookupController.getConfigs);
router.post('/configs', lookupController.saveConfig);
router.delete('/configs/:id', lookupController.deleteConfig);
router.post('/configs/test', lookupController.testConfig);

module.exports = router;
