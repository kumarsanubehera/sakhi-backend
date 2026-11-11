import { env } from '../config/env.js';
export async function complete(prompt) {
  if (!env.aiApiUrl || !env.aiApiKey) return null;
  const base = env.aiApiUrl.replace(/\/$/, '');
  const response = await fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.aiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: env.aiModel,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You are Sakhi, a maternal-health assistant for community health workers in India. Be brief and practical. Never invent measurements. If there are danger signs, say to refer the same day.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });
  if (!response.ok) return null;
  const json = await response.json();
  return json.choices?.[0]?.message?.content || null;
}