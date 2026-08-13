const express = require('express');
const router = express.Router();

const mediaController = require('../controllers/mediaController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const { renameValidator, idParamValidator } = require('../validators/mediaValidators');

router.post('/upload', requireAuth, upload, mediaController.uploadMedia);
router.get('/', requireAuth, mediaController.listMedia);
router.put('/reorder', requireAuth, mediaController.reorderMedia);
router.put('/:id', requireAuth, idParamValidator, renameValidator, validate, mediaController.updateMedia);
router.put('/:id/replace', requireAuth, idParamValidator, validate, upload, mediaController.replaceMedia);
router.delete('/:id', requireAuth, idParamValidator, validate, mediaController.deleteMedia);
router.get('/:id/usage', requireAuth, idParamValidator, validate, mediaController.getMediaUsage);

module.exports = router;
