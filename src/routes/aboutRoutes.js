const express = require('express');
const router = express.Router();

const aboutController = require('../controllers/aboutController');
const { requireAuth } = require('../middleware/auth');

router.get('/', aboutController.getAboutPage);
router.put('/', requireAuth, aboutController.updateAboutPage);

module.exports = router;
