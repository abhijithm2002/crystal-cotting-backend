const express = require('express');
const router = express.Router();

const settingsController = require('../controllers/settingsController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { settingsValidator } = require('../validators/settingsValidators');

router.get('/', settingsController.getSettings);
router.put('/', requireAuth, settingsValidator, validate, settingsController.updateSettings);

module.exports = router;
