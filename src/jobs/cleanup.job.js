import cron from 'node-cron';
import { Notification } from '../modules/notifications/notification.model.js';
import { Visit } from '../modules/visits/visit.model.js';
import { startOfDay } from '../common/utils/helpers.js';
export function startCleanupJob() {
  cron.schedule('15 2 * * *', () => {
    runCleanupJob().catch((error) => console.error('Cleanup job failed', error));
  });
}
export async function runCleanupJob() {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const removed = await Notification.deleteMany({ readAt: { $lt: cutoff } });
  const missed = await Visit.updateMany(
    { status: 'scheduled', scheduledAt: { $lt: startOfDay() } },
    { status: 'missed' },
  );
  return { notificationsRemoved: removed.deletedCount, visitsMarkedMissed: missed.modifiedCount };
}