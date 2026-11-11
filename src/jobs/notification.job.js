import cron from 'node-cron';
import { Visit } from '../modules/visits/visit.model.js';
import { notify } from '../modules/notifications/notification.service.js';
export function startNotificationJob() {
  cron.schedule('15 8 * * *', () => {
    runNotificationJob().catch((error) => console.error('Notification job failed', error));
  });
}
export async function runNotificationJob() {
  const now = new Date();
  const until = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const visits = await Visit.find({
    status: 'scheduled',
    reminderSentAt: null,
    scheduledAt: { $gte: now, $lte: until },
  }).populate('mother', 'name assignedAsha');
  let sent = 0;
  for (const visit of visits) {
    const userId = visit.assignedTo || visit.mother?.assignedAsha;
    if (!userId) continue;
    await notify({
      user: userId,
      title: 'Visit due',
      body: `A visit for ${visit.mother?.name || 'a mother'} is due within 24 hours.`,
      type: 'visit_due',
      data: { visitId: String(visit.id), motherId: String(visit.mother?._id || visit.mother) },
    });
    visit.reminderSentAt = new Date();
    await visit.save();
    sent += 1;
  }
  return sent;
}