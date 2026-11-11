import { env } from '../config/env.js';
export async function sendPush(token, { title, body, data }) {
  if (!token || !env.fcmServerKey) return { sent: false };
  const payload = {};
  for (const [key, value] of Object.entries(data || {})) {
    payload[key] = value == null ? '' : String(value);
  }
  const response = await fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'POST',
    headers: {
      Authorization: `key=${env.fcmServerKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body },
      data: payload,
    }),
  });
  return { sent: response.ok };
}