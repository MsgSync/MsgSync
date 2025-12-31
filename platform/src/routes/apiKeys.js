const express = require('express');
const router = express.Router();
const apiKeysController = require('../controllers/apiKeys');
const authenticate = require('../middleware/auth');

router.use(authenticate);

router.get('/', apiKeysController.listKeys);
router.post('/', apiKeysController.createKey);
router.post('/:id/rotate', apiKeysController.rotateKey);
router.delete('/:id', apiKeysController.deleteKey);

module.exports = router;
