const { body } = require('express-validator');

const settingsValidator = [
  body('siteName').optional().isString(),
  body('logo').optional().isString(),
  body('logoWhite').optional().isString(),
  body('favicon').optional().isString(),
  body('footerText').optional().isString(),
  body('themeColors').optional().isObject(),
  body('seo').optional().isObject(),
];

module.exports = { settingsValidator };
