const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const logger = require('./config/logger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiters');

const app = express();

// Behind a reverse proxy (Render/Heroku/Nginx) in production, needed for
// secure cookies + correct req.ip in rate limiting.
app.set('trust proxy', 1);

app.use(
  helmet({
    // Static /uploads assets get requested cross-origin by the website/dashboard.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = [process.env.WEBSITE_ORIGIN, process.env.ADMIN_ORIGIN].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (no Origin header, e.g. curl/Postman/smoke tests).
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

app.use(morgan('combined', { stream: logger.stream }));

app.use(globalLimiter);

// Static file serving for uploaded media - originals at /uploads/<file>,
// thumbnails at /uploads/thumb/<file> (thumb/ is a subfolder of uploads/).
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'painting-backend is running' });
});

app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
