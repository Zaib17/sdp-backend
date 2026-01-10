const express = require('express'); 
const { body } = require('express-validator');
const { login } = require('../controllers/authController');
const { validateRequest } = require('../middleware/validateMiddleware');

const router = express.Router();

// ✅ Login route with validation
router.post(
  '/login',
  [
    body("email")
      .isEmail()
      .withMessage("Invalid email format")
      .normalizeEmail(),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  validateRequest,
  login
);

module.exports = router;
