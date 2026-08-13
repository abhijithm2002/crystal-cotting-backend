const express = require('express');
const router = express.Router();

const contactController = require('../controllers/contactController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  contactPageValidator,
  contactMessageValidator,
  idParamValidator,
} = require('../validators/contactValidators');

// Messages - declared before "/" and "/:id"-style collisions aren't an issue
// here since messages live under their own sub-path.
router.get('/messages/export', requireAuth, contactController.exportContactMessages);
router.get('/messages', requireAuth, contactController.listContactMessages);
router.post('/messages', contactMessageValidator, validate, contactController.createContactMessage);
router.patch('/messages/:id/read', requireAuth, idParamValidator, validate, contactController.toggleMessageRead);
router.delete('/messages/:id', requireAuth, idParamValidator, validate, contactController.deleteContactMessage);

router.get('/', contactController.getContactPage);
router.put('/', requireAuth, contactPageValidator, validate, contactController.updateContactPage);

module.exports = router;
