const express = require('express');
const router = express.Router();
const accessController = require('../controllers/access');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/me', accessController.getMyAccess);
router.get('/roles', accessController.listRoles);
router.get('/customers', authorize(PERMISSIONS.ORGANIZATION_READ), accessController.listCustomers);
router.post('/customers', authorize(PERMISSIONS.ORGANIZATION_MANAGE), accessController.createCustomer);
router.get('/users', authorize(PERMISSIONS.USER_MANAGE), accessController.listUsers);
router.post('/users', authorize(PERMISSIONS.USER_MANAGE), accessController.createUser);
router.patch('/users/:id/role', authorize(PERMISSIONS.USER_MANAGE), accessController.updateUserRole);

module.exports = router;
