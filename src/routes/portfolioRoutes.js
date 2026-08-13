const express = require('express');
const router = express.Router();

const portfolioController = require('../controllers/portfolioController');
const { requireAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { portfolioValidator, idParamValidator } = require('../validators/portfolioValidators');

router.get('/', portfolioController.listPortfolio);
router.get('/:id', idParamValidator, validate, portfolioController.getPortfolioItem);
router.post('/', requireAuth, portfolioValidator, validate, portfolioController.createPortfolioItem);
router.put('/:id', requireAuth, idParamValidator, portfolioValidator, validate, portfolioController.updatePortfolioItem);
router.delete('/:id', requireAuth, idParamValidator, validate, portfolioController.deletePortfolioItem);

module.exports = router;
