const express = require('express');
const router = express.Router();

const homepageController = require('../controllers/homepageController');
const { requireAuth } = require('../middleware/auth');

router.get('/', homepageController.getHomepage);
router.put('/', requireAuth, homepageController.updateHomepage);

module.exports = router;
