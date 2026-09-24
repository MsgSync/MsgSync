const express = require('express');
const router = express.Router();
const routingController = require('../controllers/routing');

router.get('/', routingController.listRules);
router.get('/providers', routingController.listProviders);
router.post('/', routingController.createRule);
router.patch('/:id', routingController.updateRule);
router.delete('/:id', routingController.deleteRule);

module.exports = router;
