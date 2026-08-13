const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiters');
const {
  loginValidator,
  changePasswordValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} = require('../validators/authValidators');

router.post('/login', authLimiter, loginValidator, validate, authController.login);
router.post('/logout', authController.logout);
router.post('/change-password', requireAuth, changePasswordValidator, validate, authController.changePassword);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);
router.get('/me', requireAuth, authController.me);

module.exports = router;
