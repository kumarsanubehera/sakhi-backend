import { AppError } from '../../common/utils/helpers.js';
import { Notification } from './notification.model.js';
import { User } from '../users/user.model.js';
import { sendPush } from '../../integrations/push.service.js';
export async function notify({ user, title, body, type, data }) {
  const notification = await Notification.create({ user, title, body, type, data: data || {} });
  const account = await User.findById(user).select('fcmToken');
  if (account?.fcmToken) {
    await sendPush(account.fcmToken, { title, body, data }).catch((error) => {
      console.error('Push delivery failed', error.message);
    });
  }
  return notification;
}
export function listFor(userId) {
  return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
}
export async function markRead(id, userId) {
  const notification = await Notification.findOne({ _id: id, user: userId });
  if (!notification) throw new AppError('Notification not found', 404);
  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }
  return notification;
}
export async function markAllRead(userId) {
  await Notification.updateMany({ user: userId, readAt: null }, { readAt: new Date() });
}