const express = require('express');
const router = express.Router();
const {
  sendVerificationCode,
  verifyCode,
  resetPassword,
} = require('../controllers/passwordController');

router.post('/forgot-password', sendVerificationCode);
router.post('/verify-code', verifyCode);
router.post('/reset-password', resetPassword);

module.exports = router;
