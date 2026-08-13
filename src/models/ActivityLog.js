const mongoose = require('mongoose');

/**
 * Lightweight activity feed for the dashboard's "recentUpdates" list.
 * Not part of the public API contract - purely an internal convenience
 * collection so /api/dashboard/stats can show a human-readable feed
 * without expensive cross-collection sorts on every request.
 */
const ActivityLogSchema = new mongoose.Schema(
  {
    collectionName: { type: String, required: true },
    action: { type: String, required: true }, // created | updated | deleted
    summary: { type: String, required: true },
  },
  { timestamps: true, collection: 'activity_log' }
);

ActivityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
