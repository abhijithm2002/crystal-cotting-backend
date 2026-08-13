const ActivityLog = require('../models/ActivityLog');
const logger = require('../config/logger');

/** Fire-and-forget activity log entry for the dashboard's recentUpdates feed. */
async function logActivity(collectionName, action, summary) {
  try {
    await ActivityLog.create({ collectionName, action, summary });
  } catch (err) {
    // Never let activity logging break the main request flow.
    logger.warn(`Failed to write activity log: ${err.message}`);
  }
}

module.exports = logActivity;
