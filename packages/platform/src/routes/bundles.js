const express = require('express');
const router = express.Router();
const bundleController = require('../controllers/bundles');

router.get('/', bundleController.listBundles);
router.post('/', bundleController.createBundle);
router.patch('/:id', bundleController.updateBundle);
router.post('/subscribe', bundleController.subscribe);
router.get('/organization/:orgId', bundleController.getOrgSubscriptions);

module.exports = router;
