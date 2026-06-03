import webpush from 'web-push';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Conversation } from '../models/Conversation.js';
import { logger } from '../utils/logger.js';

const SUB = 'mailto:securechat@aura.app';

if (env.vapidPublicKey && env.vapidPrivateKey) {
  webpush.setVapidDetails(SUB, env.vapidPublicKey, env.vapidPrivateKey);
} else {
  logger.warn('VAPID keys not set in env — Web Push disabled. Generate keys with: npx web-push generate-vapid-keys');
}

export async function sendPushNotification(recipientId, payload) {
  if (!env.vapidPublicKey || !env.vapidPrivateKey) return;
  try {
    const user = await User.findById(recipientId).select('pushSubscriptions').lean();
    if (!user?.pushSubscriptions?.length) return;
    const data = JSON.stringify(payload);
    await Promise.allSettled(
      user.pushSubscriptions.map(sub =>
        webpush.sendNotification(sub, data).catch(err => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            User.findByIdAndUpdate(recipientId, {
              $pull: { pushSubscriptions: { endpoint: sub.endpoint } }
            }).catch(() => {});
          } else {
            logger.error('Push send failed:', err.message);
          }
        })
      )
    );
  } catch (err) {
    logger.error('Push notification error:', err.message);
  }
}

export async function notifyOfflineParticipants(io, message, senderId, senderName) {
  try {
    const conv = await Conversation.findById(message.conversationId).select('participants').lean();
    if (!conv) return;
    for (const pid of conv.participants) {
      const pidStr = pid.toString();
      if (pidStr === senderId.toString()) continue;
      const room = io.sockets.adapter.rooms.get(`user:${pidStr}`);
      if (!room || room.size === 0) {
        const hasAttachments = message.attachments?.length > 0;
        const body = message.body || (hasAttachments ? 'Sent an image' : 'Encrypted message');
        await sendPushNotification(pidStr, {
          title: senderName || 'New message',
          body,
          url: `/chat/${message.conversationId}`,
          tag: `msg-${message.conversationId}`,
        });
      }
    }
  } catch (err) {
    logger.error('notifyOfflineParticipants error:', err.message);
  }
}

export function getVapidPublicKey() {
  return env.vapidPublicKey || '';
}
