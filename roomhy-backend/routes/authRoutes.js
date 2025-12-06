const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);

// Owner specific flows (temp password verification and set new password)
router.post('/owner/verify-temp', authController.verifyOwnerTemp);
router.post('/owner/set-password', authController.setOwnerPassword);

// Tenant specific flows (temp password verification and set new password)
router.post('/tenant/verify-temp', authController.verifyTenantTemp);
router.post('/tenant/set-password', authController.setTenantPassword);

module.exports = router;
