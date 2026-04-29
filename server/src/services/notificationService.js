// Called by other controllers to fan-out in-app notifications.
// Fails silently so the primary operation never breaks.

async function createNotification(db, { userId, type, title, message, relatedId, relatedType }) {
  try {
    await db.Notification.create({ userId, type, title, message, relatedId, relatedType, isRead: false });
  } catch (err) {
    console.error("[Notification create failed]", err.message);
  }
}

module.exports = { createNotification };
